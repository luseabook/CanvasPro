const DEBUG_STORAGE_KEY = 'aic.videoPlaybackDebug',
  DEBUG_URL_PARAM = 'aicVideoDebug',
  DEFAULT_MIN_BUFFER_AHEAD_SECONDS = 0.75,
  DEFAULT_READY_TIMEOUT_MS = 700,
  DEFAULT_RECOVERY_DEBOUNCE_MS = 250,
  DEFAULT_RECOVERY_COOLDOWN_MS = 900,
  DEFAULT_STARTUP_RECOVERY_GRACE_MS = 1200,
  DEFAULT_STARTUP_RECOVERY_MIN_PLAYED_SECONDS = 0.08,
  HOVER_PLAYBACK_INTENT = 'hover',
  EXCLUSIVE_PLAYBACK_INTENT = 'exclusive',
  videoRecoveryStates = new WeakMap(),
  activePlaybackVideos = new Set();
export function isVideoPlaybackDebugEnabled() {
  try {
    if (globalThis.window?.AIC_VIDEO_DEBUG === true) return true;
  } catch {}
  try {
    const value = globalThis.localStorage?.getItem(DEBUG_STORAGE_KEY);
    if (value === '1' || value === 'true') return true;
  } catch {}
  try {
    const item = globalThis.window?.location?.search || '';
    if (item) {
      const map = new URLSearchParams(item),
        key = map.get(DEBUG_URL_PARAM);
      if (key === '1' || key === 'true') return true;
    }
  } catch {}
  return false;
}
export function getVideoCurrentSource(enabled) {
  if (!enabled) return '';
  return String(enabled.currentSrc || enabled.getAttribute?.('src') || enabled.src || '').trim();
}
export function getVideoBufferedRanges(index) {
  const list = [],
    start = index?.buffered;
  if (!start) return list;
  for (let result = 0; result < start.length; result++) {
    try {
      list.push({ start: start.start(result), end: start.end(result) });
    } catch {}
  }
  return list;
}
export function getVideoBufferedAhead(enabled2, data = null) {
  if (!enabled2) return 0;
  const options = data !== null && data !== undefined,
    target = options && Number.isFinite(Number(data)) ? Number(data) : Number(enabled2.currentTime || 0);
  let source = 0;
  for (const next of getVideoBufferedRanges(enabled2)) {
    if (next.end < target) continue;
    next.start <= target + 0.15 && (source = Math.max(source, next.end - target));
  }
  return source;
}
export function hasVideoBufferedAhead(enabled3, current = DEFAULT_MIN_BUFFER_AHEAD_SECONDS) {
  if (!enabled3) return false;
  const count = Number(enabled3.duration),
    entry = Number(enabled3.currentTime || 0);
  if (Number.isFinite(count) && count > 0) {
    const record = count - entry;
    if (record <= Math.max(0.35, current)) return true;
  }
  if (Number(enabled3.readyState || 0) >= 4) return true;
  return getVideoBufferedAhead(enabled3, entry) >= current;
}
export function getVideoPlaybackSnapshot(enabled4) {
  return {
    currentTime: Number(enabled4?.currentTime || 0),
    duration: Number(enabled4?.duration || 0),
    readyState: Number(enabled4?.readyState || 0),
    networkState: Number(enabled4?.networkState || 0),
    paused: !!enabled4?.paused,
    preload: String(enabled4?.preload || ''),
    src: getVideoCurrentSource(enabled4),
    buffered: getVideoBufferedRanges(enabled4),
  };
}
export function logVideoPlaybackEvent(payload, handle, state = {}) {
  const config = videoRecoveryStates.get(payload) || {},
    scope = state.label || config.label || 'video';
  if (!isVideoPlaybackDebugEnabled()) return;
  try {
    console.debug('[video-playback]', scope, handle, {
      ...getVideoPlaybackSnapshot(payload),
      ...(state.extra || {}),
    });
  } catch {}
}
export function attachVideoPlaybackRecovery(enabled5, input = {}) {
  if (!enabled5) return null;
  let enabled6 = videoRecoveryStates.get(enabled5);
  return (
    !enabled6 &&
      ((enabled6 = {
        disposed: false,
        label: 'video',
        ensureSrc: null,
        shouldRecover: null,
        minBufferAhead: DEFAULT_MIN_BUFFER_AHEAD_SECONDS,
        readyTimeoutMs: DEFAULT_READY_TIMEOUT_MS,
        recoveryDebounceMs: DEFAULT_RECOVERY_DEBOUNCE_MS,
        recoveryCooldownMs: DEFAULT_RECOVERY_COOLDOWN_MS,
        startupRecoveryGraceMs: DEFAULT_STARTUP_RECOVERY_GRACE_MS,
        startupRecoveryMinPlayedSeconds: DEFAULT_STARTUP_RECOVERY_MIN_PLAYED_SECONDS,
        recoveryTimer: null,
        lastRecoveryAt: 0,
        lastPlayRequestAt: 0,
        lastPlayingAt: 0,
        playbackIntent: EXCLUSIVE_PLAYBACK_INTENT,
      }),
      videoRecoveryStates.set(enabled5, enabled6),
      installMediaEventListeners(enabled5, enabled6)),
    (enabled6.disposed = false),
    updateRecoveryState(enabled6, input),
    enabled6
  );
}
export function detachVideoPlaybackRecovery(enabled7) {
  if (!enabled7) return false;
  const enabled8 = videoRecoveryStates.get(enabled7),
    output = activePlaybackVideos.delete(enabled7);
  if (!enabled8) return output;
  enabled8.disposed = true;
  if (enabled8.recoveryTimer !== null) clearTimeout(enabled8.recoveryTimer);
  enabled8.recoveryTimer = null;
  enabled8.ensureSrc = null;
  enabled8.shouldRecover = null;
  return true;
}
export async function prepareVideoForPlayback(enabled9, value2 = {}) {
  if (!enabled9) return false;
  const label = attachVideoPlaybackRecovery(enabled9, value2);
  if (!(await ensureVideoSource(enabled9, label))) return false;
  if (enabled9.preload !== 'auto') enabled9.preload = 'auto';
  return (logVideoPlaybackEvent(enabled9, 'prepare', { label: label.label }), true);
}
export function claimVideoPlaybackOwnership(enabled10, value3 = {}) {
  if (!enabled10) return false;
  const label2 = attachVideoPlaybackRecovery(enabled10, value3),
    playbackIntent = resolvePlaybackIntent(enabled10, label2, value3.playbackIntent);
  if (value3.allowConcurrent !== true && !prepareActiveVideosForPlayback(enabled10, playbackIntent))
    return (
      logVideoPlaybackEvent(enabled10, 'play-blocked', {
        label: label2.label,
        extra: { playbackIntent: playbackIntent },
      }),
      false
    );
  label2.playbackIntent = playbackIntent;
  return true;
}
export async function playVideoWithRecovery(enabled11, value4 = {}) {
  if (!enabled11) return false;
  const label3 = attachVideoPlaybackRecovery(enabled11, value4),
    prepareVideoForPlayback2 = await prepareVideoForPlayback(enabled11, value4);
  if (!prepareVideoForPlayback2) return false;
  if (!shouldContinuePlayback(value4)) return (safePause(enabled11), false);
  if (!claimVideoPlaybackOwnership(enabled11, value4)) return false;
  try {
    label3.lastPlayRequestAt = Date.now();
    const promise = enabled11.play?.();
    promise && typeof promise.then === 'function' && (await promise);
  } catch (name) {
    return (
      !isIgnorablePlayError(name) &&
        logVideoPlaybackEvent(enabled11, 'play-error', {
          label: label3.label,
          extra: { name: name?.name || '', message: name?.message || String(name || '') },
        }),
      false
    );
  }
  if (!shouldContinuePlayback(value4)) return (safePause(enabled11), false);
  return (
    activePlaybackVideos.add(enabled11),
    logVideoPlaybackEvent(enabled11, 'play-request', { label: label3.label }),
    true
  );
}
function updateRecoveryState(enabled12, value5) {
  if (!enabled12) return;
  if (value5.label) enabled12.label = String(value5.label);
  if (typeof value5.ensureSrc === 'function') enabled12.ensureSrc = value5.ensureSrc;
  if (typeof value5.shouldRecover === 'function') enabled12.shouldRecover = value5.shouldRecover;
  (Number.isFinite(Number(value5.minBufferAhead)) &&
    (enabled12.minBufferAhead = Math.max(0.5, Number(value5.minBufferAhead))),
    Number.isFinite(Number(value5.readyTimeoutMs)) &&
      (enabled12.readyTimeoutMs = Math.max(100, Number(value5.readyTimeoutMs))),
    Number.isFinite(Number(value5.recoveryDebounceMs)) &&
      (enabled12.recoveryDebounceMs = Math.max(50, Number(value5.recoveryDebounceMs))),
    Number.isFinite(Number(value5.recoveryCooldownMs)) &&
      (enabled12.recoveryCooldownMs = Math.max(100, Number(value5.recoveryCooldownMs))),
    Number.isFinite(Number(value5.startupRecoveryGraceMs)) &&
      (enabled12.startupRecoveryGraceMs = Math.max(0, Number(value5.startupRecoveryGraceMs))),
    Number.isFinite(Number(value5.startupRecoveryMinPlayedSeconds)) &&
      (enabled12.startupRecoveryMinPlayedSeconds = Math.max(
        0,
        Number(value5.startupRecoveryMinPlayedSeconds),
      )));
}
function installMediaEventListeners(el, label4) {
  const value6 = ['play', 'playing', 'pause', 'waiting', 'stalled', 'progress', 'canplay'];
  for (const value7 of value6) {
    el.addEventListener?.(value7, () => {
      logVideoPlaybackEvent(el, value7, { label: label4.label });
    });
  }
  for (const value8 of ['waiting', 'stalled']) {
    el.addEventListener?.(value8, () => {
      scheduleStallRecovery(el, label4, value8);
    });
  }
  (el.addEventListener?.('play', () => {
    ((label4.lastPlayRequestAt = Date.now()), activePlaybackVideos.add(el));
  }),
    el.addEventListener?.('playing', () => {
      label4.lastPlayingAt = Date.now();
    }),
    el.addEventListener?.('pause', () => activePlaybackVideos.delete(el)),
    el.addEventListener?.('ended', () => activePlaybackVideos.delete(el)));
}
async function ensureVideoSource(value9, value10) {
  if (getVideoCurrentSource(value9)) return true;
  if (typeof value10?.ensureSrc !== 'function') return false;
  try {
    await value10.ensureSrc(value9);
  } catch {}
  return !!getVideoCurrentSource(value9);
}
function scheduleStallRecovery(value11, value12, value13) {
  if (value12.recoveryTimer) clearTimeout(value12.recoveryTimer);
  value12.recoveryTimer = setTimeout(
    () => {
      ((value12.recoveryTimer = null), void recoverStalledPlayback(value11, value12, value13));
    },
    Math.max(50, Number(value12.recoveryDebounceMs || DEFAULT_RECOVERY_DEBOUNCE_MS)),
  );
}
async function recoverStalledPlayback(enabled13, label5, value14) {
  if (!enabled13 || !shouldRecoverPlayback(enabled13, label5)) return;
  const value15 = Date.now(),
    retryInMs = getStartupRecoveryDelayMs(enabled13, label5, value15);
  if (retryInMs > 0) {
    (logVideoPlaybackEvent(enabled13, value14 + '-startup-grace', {
      label: label5.label,
      extra: { retryInMs: retryInMs },
    }),
      (label5.recoveryTimer = setTimeout(() => {
        ((label5.recoveryTimer = null), void recoverStalledPlayback(enabled13, label5, value14));
      }, retryInMs)));
    return;
  }
  const value16 = Math.max(100, Number(label5.recoveryCooldownMs || DEFAULT_RECOVERY_COOLDOWN_MS));
  if (value15 - Number(label5.lastRecoveryAt || 0) < value16) return;
  if (hasVideoBufferedAhead(enabled13, label5.minBufferAhead)) return;
  if (!(await ensureVideoSource(enabled13, label5))) return;
  label5.lastRecoveryAt = value15;
  const enabled14 = !!enabled13.paused;
  (logVideoPlaybackEvent(enabled13, value14 + '-recovery', { label: label5.label }),
    await reloadVideoPreservingTime(enabled13, label5, value14));
  if (!enabled14 && shouldRecoverPlayback(enabled13, label5))
    try {
      const promise2 = enabled13.play?.();
      promise2 && typeof promise2.catch === 'function' && promise2.catch(() => {});
    } catch {}
}
function getStartupRecoveryDelayMs(value17, value18, value19 = Date.now()) {
  const count2 = Math.max(0, Number(value18?.startupRecoveryGraceMs ?? DEFAULT_STARTUP_RECOVERY_GRACE_MS));
  if (!(count2 > 0)) return 0;
  const count3 = Math.max(Number(value18?.lastPlayRequestAt || 0), Number(value18?.lastPlayingAt || 0));
  if (!(count3 > 0)) return 0;
  const value20 = value19 - count3;
  if (value20 >= count2) return 0;
  const value21 = Math.max(
    0,
    Number(value18?.startupRecoveryMinPlayedSeconds ?? DEFAULT_STARTUP_RECOVERY_MIN_PLAYED_SECONDS),
  );
  if (Number(value17?.currentTime || 0) > value21) return 0;
  return Math.max(50, Math.ceil(count2 - value20));
}
function shouldRecoverPlayback(el2, enabled15) {
  if (el2?.isConnected === false) return false;
  if (typeof enabled15?.shouldRecover === 'function')
    try {
      return !!enabled15.shouldRecover(el2);
    } catch {
      return false;
    }
  return !el2?.paused;
}
async function reloadVideoPreservingTime(enabled16, label6, value22) {
  const videoCurrentSource = getVideoCurrentSource(enabled16);
  if (!videoCurrentSource) return;
  const count4 = Number(enabled16.currentTime || 0),
    handler = () => {
      if (!(count4 > 0)) return;
      const count5 = Number(enabled16.duration),
        value23 =
          Number.isFinite(count5) && count5 > 0 ? Math.min(count4, Math.max(0, count5 - 0.05)) : count4;
      try {
        enabled16.currentTime = value23;
      } catch {}
    };
  logVideoPlaybackEvent(enabled16, value22 + '-load', { label: label6.label });
  try {
    if (!enabled16.getAttribute?.('src') && videoCurrentSource) enabled16.src = videoCurrentSource;
    enabled16.load?.();
  } catch {}
  if (Number(enabled16.readyState || 0) >= 1) handler();
  (await waitForVideoReadiness(enabled16, label6.readyTimeoutMs), handler());
}
function waitForVideoReadiness(el3, value24) {
  if (!el3 || Number(el3.readyState || 0) >= 2) return Promise.resolve(true);
  return new Promise((handler2) => {
    let value25 = false;
    const value26 = ['loadeddata', 'canplay', 'canplaythrough', 'progress', 'error'],
      handler3 = () => {
        if (value25) return;
        ((value25 = true), clearTimeout(setTimeout2));
        for (const value27 of value26) {
          el3.removeEventListener?.(value27, value28);
        }
      },
      value28 = () => {
        (handler3(), handler2(Number(el3.readyState || 0) >= 2));
      },
      setTimeout2 = setTimeout(
        () => {
          (handler3(), handler2(Number(el3.readyState || 0) >= 2));
        },
        Math.max(100, Number(value24 || DEFAULT_READY_TIMEOUT_MS)),
      );
    for (const value29 of value26) {
      el3.addEventListener?.(value29, value28);
    }
  });
}
function shouldContinuePlayback(enabled17) {
  if (typeof enabled17.shouldContinue !== 'function') return true;
  try {
    return !!enabled17.shouldContinue();
  } catch {
    return false;
  }
}
function safePause(value30) {
  try {
    value30?.pause?.();
  } catch {}
}
function resolvePlaybackIntent(value31, value32, value33) {
  const value34 = value33 === HOVER_PLAYBACK_INTENT ? HOVER_PLAYBACK_INTENT : EXCLUSIVE_PLAYBACK_INTENT;
  if (
    value34 === HOVER_PLAYBACK_INTENT &&
    activePlaybackVideos.has(value31) &&
    value31?.paused === false &&
    value32?.playbackIntent !== HOVER_PLAYBACK_INTENT
  )
    return EXCLUSIVE_PLAYBACK_INTENT;
  return value34;
}
function prepareActiveVideosForPlayback(value35, value36) {
  let enabled18 = false;
  for (const el4 of Array.from(activePlaybackVideos)) {
    if (!el4 || el4 === value35) continue;
    if (el4.isConnected === false) {
      activePlaybackVideos.delete(el4);
      continue;
    }
    const value37 = videoRecoveryStates.get(el4)?.playbackIntent || EXCLUSIVE_PLAYBACK_INTENT;
    if (value36 === HOVER_PLAYBACK_INTENT && value37 !== HOVER_PLAYBACK_INTENT) {
      enabled18 = true;
      continue;
    }
    (safePause(el4), activePlaybackVideos.delete(el4));
  }
  return !enabled18;
}
export function __resetVideoPlaybackRecoveryForTest() {
  activePlaybackVideos.clear();
}
function isIgnorablePlayError(error) {
  const value38 = error && typeof error === 'object' ? error.name : '',
    list2 = error && typeof error === 'object' ? String(error.message || '') : String(error || '');
  return value38 === 'AbortError' || list2.includes('interrupted by a call to pause');
}
