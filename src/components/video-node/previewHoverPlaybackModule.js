// Hover-to-play subsystem for the AI video node preview surface.
//
// Why this module exists
// ----------------------
// `AIGenVideoNode.mount()` wires the preview element with
//
//   previewEl.addEventListener('mouseenter', () => this.activatePreviewHoverPlayback())
//   previewEl.addEventListener('mouseleave', () => this._deactivatePreviewHoverPlayback())
//
// but the two methods themselves were lost while the node was split into the
// `video-node/*` mixin modules: `unmount()` still tears the subsystem down
// (`_previewHoverActivationPending`, `_cancelPreviewHoverRetryTimers`,
// `_hoverPlaybackLifecycle`, `_hoverPlaybackResumeState`), so every hover on an
// AI video node threw `TypeError: this.activatePreviewHoverPlayback is not a
// function` while the teardown code kept running clean.
//
// Why it does not delegate to `source-video/sourceVideoHoverPlayback.js`
// ---------------------------------------------------------------------
// `deactivateSourceVideoHoverPlayback()` is written against `SourceVideoNode`'s
// member set: it unconditionally calls `label._getPlaybackLabel('hover')`,
// `label._syncRendererPlaybackPin()` and `label._syncPlaybackChromeVisibility()`.
// None of those three live on `AIGenVideoNode`, so delegating would raise the
// exact same `TypeError` this module is meant to remove. The AI video node owns
// a different playback surface (`videoEl` / `_getActivePreviewVideoEl()` /
// `_multiLayerEls` plus the `previewControlsModule` chrome), so the two methods
// are implemented here against that surface, reusing only the side-effect-free
// predicates from `shared/hoverVideoPlaybackLifecycle.js`.
//
// Contract
// --------
// Both entry points are total functions: they never throw, whatever state the
// node is in (missing element, empty `src`, detached DOM, rejected
// `play()` from the browser autoplay policy, or a jsdom element whose media
// pipeline is not implemented). Hover handlers run on raw DOM events, so an
// exception here escapes into the event loop and breaks the whole preview.
import {
  isExternallyOwnedVideoPlayback,
  shouldKeepManualPlaybackPresentationActive,
} from '../shared/hoverVideoPlaybackLifecycle.js';

/** Prefix used for every diagnostic emitted by this module. */
const LOG_PREFIX = '[AIGenVideoNode]';

/**
 * Tells whether a value behaves like a media element we can drive.
 * @param {unknown} value Candidate element.
 * @returns {boolean} True for objects exposing `play()` and `pause()`.
 */
function isControllableVideo(value) {
  return (
    !!value &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof value.play === 'function' &&
    typeof value.pause === 'function'
  );
}

/**
 * Reads the current media source of a video element, trimmed.
 * Checks the attribute first (survives `src` being rewritten by the object-URL
 * lifecycle), then the resolved property, then `currentSrc`.
 * @param {any} video Video element.
 * @returns {string} Media source, or `''` when the element has no source yet.
 */
function readVideoSrc(video) {
  if (!video) return '';
  const pick = (value) => (typeof value === 'string' ? value.trim() : '');
  let attributeSrc = '';
  try {
    attributeSrc = pick(typeof video.getAttribute === 'function' ? video.getAttribute('src') : '');
  } catch {
    attributeSrc = '';
  }
  return attributeSrc || pick(video.src) || pick(video.currentSrc);
}

/**
 * Resolves the video element this node should drive on hover.
 *
 * `AIGenVideoNode` keeps its element on `videoEl` (`_video` is only used by
 * `SourceVideoNode`), so the lookup is defensive and ordered from the most
 * specific field to the multi-layer fallback used by the expanded result view.
 * @param {any} owner Node instance (`this` inside the prototype methods).
 * @returns {any} A controllable video element, or `null`.
 */
function resolveHoverVideoElement(owner) {
  try {
    if (isControllableVideo(owner?._video)) return owner._video;
    if (isControllableVideo(owner?.videoEl)) return owner.videoEl;
    if (typeof owner?._getActivePreviewVideoEl === 'function') {
      const active = owner._getActivePreviewVideoEl();
      if (isControllableVideo(active)) return active;
    }
    const layers = owner?._multiLayerEls;
    if (Array.isArray(layers)) {
      for (const layer of layers) if (isControllableVideo(layer)) return layer;
    }
  } catch (error) {
    console.warn(`${LOG_PREFIX} resolve hover video failed:`, error);
    return null;
  }
  return null;
}

/**
 * Assigns `loop` without letting a read-only/frozen element break the handler.
 * @param {any} video Video element.
 * @param {boolean} enabled Desired loop flag.
 * @returns {boolean} True when the assignment went through.
 */
function setVideoLoop(video, enabled) {
  try {
    video.loop = enabled === true;
    return true;
  } catch {
    return false;
  }
}

/**
 * Starts playback and neutralises the promise rejection.
 *
 * Both jsdom (`Not implemented: HTMLMediaElement.prototype.play`) and real
 * browsers (autoplay policy, detached source) reject or throw here; a hover
 * handler must not surface either.
 * @param {any} video Video element.
 * @returns {boolean} True when `play()` was invoked.
 */
function requestVideoPlayback(video) {
  try {
    const pending = video.play();
    if (pending && typeof pending.catch === 'function') pending.catch(() => {});
    return true;
  } catch {
    return false;
  }
}

/**
 * Remembers where playback started, so a later resume can return to the frame
 * the pointer hovered over (mirrors `SourceVideoNode._hoverPlaybackResumeState`).
 * @param {any} owner Node instance.
 * @param {any} video Video element.
 * @returns {{ currentTime: number, src: string }} Recorded snapshot.
 */
function recordHoverPlaybackResumeState(owner, video) {
  const rawTime = Number(video?.currentTime);
  const snapshot = {
    currentTime: Number.isFinite(rawTime) && rawTime > 0 ? rawTime : 0,
    src: readVideoSrc(video),
  };
  owner._hoverPlaybackResumeState = snapshot;
  return snapshot;
}

/**
 * Tells whether the node is currently showing the expanded multi-video view, in
 * which case the preview chrome (and its hover playback) must stay inert.
 * Store state wins because `_data` can lag one render behind.
 * @param {any} owner Node instance.
 * @param {any} store Canvas store, when available.
 * @returns {boolean} True when the videos panel is expanded.
 */
function isVideosExpanded(owner, store) {
  try {
    const node = store?.getState?.()?.nodes?.[owner?.nodeId];
    if (node && node.isVideosExpanded === true) return true;
  } catch {
    /* Store not ready: fall through to the node's own snapshot. */
  }
  return owner?._data?.isVideosExpanded === true;
}

/**
 * Builds the hover playback prototype methods for `AIGenVideoNode`.
 *
 * The factory returns a plain prototype object (not a class instance) because
 * `applyClassPrototypeMethods()` copies `Object.getOwnPropertyDescriptors()` —
 * the same convention as `previewControlsModule.js` / `resultRenderModule.js`.
 * @param {{ store?: any }} [index] Shared module dependency index.
 * @returns {object} Prototype holding `activatePreviewHoverPlayback` and
 *   `_deactivatePreviewHoverPlayback`.
 */
export function createVideoNodePreviewHoverPlaybackModule(index = {}) {
  const { store: store = null } = index || {};
  class result {
    /**
     * Hover-enter: start the preview video and pin the node into the
     * "interaction active" state that the renderer reads (`getRendererMediaState`).
     * @returns {boolean} True when hover playback is (already) running.
     */
    ['activatePreviewHoverPlayback']() {
      try {
        // Re-entry guard: `mouseenter` can fire again before the previous frame
        // settled (expanded/collapsed preview swaps), and the flag is also reset
        // by `unmount()`.
        if (this._previewHoverActivationPending === true) return false;
        if (isVideosExpanded(this, store)) return false;
        const video = resolveHoverVideoElement(this);
        // No element or no source yet (media still deferred / first frame not
        // attached): nothing to play, and `play()` would only reject.
        if (!video || !readVideoSrc(video)) return false;
        this._previewHoverActivationPending = true;
        recordHoverPlaybackResumeState(this, video);
        try {
          this._hoverPlaybackLifecycle?.activate?.();
        } catch (error) {
          console.warn(`${LOG_PREFIX} hover playback lifecycle activate failed:`, error);
        }
        this._isHovered = true;
        // A user-initiated playback (or an external owner such as the video clip
        // editor / keying controller) keeps its own presentation: do not retake
        // it, do not touch `loop`.
        if (isExternallyOwnedVideoPlayback(video)) return true;
        if (shouldKeepManualPlaybackPresentationActive(this, video)) return true;
        if (this._hoverManualPause === true || this._isManualLoopPlayback === true) return false;
        setVideoLoop(video, true);
        requestVideoPlayback(video);
        return true;
      } catch (error) {
        console.warn(`${LOG_PREFIX} activatePreviewHoverPlayback failed:`, error);
        return false;
      } finally {
        this._previewHoverActivationPending = false;
      }
    }

    /**
     * Hover-leave: unpin hover state and stop hover playback unless the media is
     * owned by manual playback. Never throws.
     * @returns {boolean} True when a video element was found and released.
     */
    ['_deactivatePreviewHoverPlayback']() {
      try {
        this._isHovered = false;
        this._previewHoverActivationPending = false;
        const video = resolveHoverVideoElement(this);
        const keepPlaying = video ? shouldKeepManualPlaybackPresentationActive(this, video) : false;
        if (video && !keepPlaying) {
          setVideoLoop(video, false);
          try {
            video.pause();
          } catch {
            /* Detached or already paused: nothing left to release. */
          }
        }
        this._hoverManualPause = false;
        if (!keepPlaying && this._isManualLoopPlayback !== true) this._isManualControl = false;
        try {
          this._hoverPlaybackLifecycle?.deactivate?.({ release: false });
        } catch (error) {
          console.warn(`${LOG_PREFIX} hover playback lifecycle deactivate failed:`, error);
        }
        return !!video;
      } catch (error) {
        console.warn(`${LOG_PREFIX} _deactivatePreviewHoverPlayback failed:`, error);
        return false;
      }
    }
  }
  return result.prototype;
}
