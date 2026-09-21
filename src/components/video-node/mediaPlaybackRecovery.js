const DEBUG_STORAGE_KEY = 'aic.videoPlaybackDebug',
  DEBUG_URL_PARAM = 'aicVideoDebug',
  DEFAULT_MIN_BUFFER_AHEAD_SECONDS = 0.75,
  DEFAULT_READY_TIMEOUT_MS = 0x2bc,
  DEFAULT_RECOVERY_DEBOUNCE_MS = 250,
  DEFAULT_RECOVERY_COOLDOWN_MS = 0x384,
  DEFAULT_STARTUP_RECOVERY_GRACE_MS = 0x4b0,
  DEFAULT_STARTUP_RECOVERY_MIN_PLAYED_SECONDS = 0.08,
  videoRecoveryStates = new WeakMap(),
  activePlaybackVideos = new Set();
export function isVideoPlaybackDebugEnabled() {
  try {
    if (globalThis.window?.AIC_VIDEO_DEBUG === true) return true;
  } catch {}
  try {
    const _0x2ef694 = globalThis.localStorage?.getItem(DEBUG_STORAGE_KEY);
    if (_0x2ef694 === '1' || _0x2ef694 === 'true') return true;
  } catch {}
  try {
    const _0x2d8e6f = globalThis.window?.location?.search || '';
    if (_0x2d8e6f) {
      const _0x114562 = new URLSearchParams(_0x2d8e6f),
        _0x529fb2 = _0x114562.get(DEBUG_URL_PARAM);
      if (_0x529fb2 === '1' || _0x529fb2 === 'true') return true;
    }
  } catch {}
  return false;
}
export function getVideoCurrentSource(_0x136252) {
  if (!_0x136252) return '';
  return String(_0x136252.currentSrc || _0x136252.getAttribute?.('src') || _0x136252.src || '').trim();
}
export function getVideoBufferedRanges(_0x2e7c34) {
  const _0x383965 = [],
    _0x4fc5c7 = _0x2e7c34?.buffered;
  if (!_0x4fc5c7) return _0x383965;
  for (let _0x1353ca = 0; _0x1353ca < _0x4fc5c7.length; _0x1353ca++) {
    try {
      _0x383965.push({ start: _0x4fc5c7.start(_0x1353ca), end: _0x4fc5c7.end(_0x1353ca) });
    } catch {}
  }
  return _0x383965;
}
export function getVideoBufferedAhead(_0x210a4a, _0x3f1737 = null) {
  if (!_0x210a4a) return 0;
  const _0x567257 = _0x3f1737 !== null && _0x3f1737 !== undefined,
    _0x46ef5c =
      _0x567257 && Number.isFinite(Number(_0x3f1737))
        ? Number(_0x3f1737)
        : Number(_0x210a4a.currentTime || 0);
  let _0x3bd4c3 = 0;
  for (const _0x36eed0 of getVideoBufferedRanges(_0x210a4a)) {
    if (_0x36eed0.end < _0x46ef5c) continue;
    _0x36eed0.start <= _0x46ef5c + 0.15 && (_0x3bd4c3 = Math.max(_0x3bd4c3, _0x36eed0.end - _0x46ef5c));
  }
  return _0x3bd4c3;
}
export function hasVideoBufferedAhead(_0x3ee896, _0x283322 = DEFAULT_MIN_BUFFER_AHEAD_SECONDS) {
  if (!_0x3ee896) return false;
  const _0x3a2653 = Number(_0x3ee896.duration),
    _0x38eec5 = Number(_0x3ee896.currentTime || 0);
  if (Number.isFinite(_0x3a2653) && _0x3a2653 > 0) {
    const _0x26bb13 = _0x3a2653 - _0x38eec5;
    if (_0x26bb13 <= Math.max(0.35, _0x283322)) return true;
  }
  if (Number(_0x3ee896.readyState || 0) >= 4) return true;
  return getVideoBufferedAhead(_0x3ee896, _0x38eec5) >= _0x283322;
}
export function getVideoPlaybackSnapshot(_0x42cc71) {
  return {
    currentTime: Number(_0x42cc71?.currentTime || 0),
    duration: Number(_0x42cc71?.duration || 0),
    readyState: Number(_0x42cc71?.readyState || 0),
    networkState: Number(_0x42cc71?.networkState || 0),
    paused: !!_0x42cc71?.paused,
    preload: String(_0x42cc71?.preload || ''),
    src: getVideoCurrentSource(_0x42cc71),
    buffered: getVideoBufferedRanges(_0x42cc71),
  };
}
export function logVideoPlaybackEvent(_0x110412, _0x30ff25, _0x5c638e = {}) {
  const _0x6d3b2a = videoRecoveryStates.get(_0x110412) || {},
    _0x1d2cc0 = _0x5c638e.label || _0x6d3b2a.label || 'video';
  if (!isVideoPlaybackDebugEnabled()) return;
  try {
    console.debug('[video-playback]', _0x1d2cc0, _0x30ff25, {
      ...getVideoPlaybackSnapshot(_0x110412),
      ...(_0x5c638e.extra || {}),
    });
  } catch {}
}
export function attachVideoPlaybackRecovery(_0x29b5c3, _0x3ae755 = {}) {
  if (!_0x29b5c3) return null;
  let _0x2a7d8a = videoRecoveryStates.get(_0x29b5c3);
  return (
    !_0x2a7d8a &&
      ((_0x2a7d8a = {
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
      }),
      videoRecoveryStates.set(_0x29b5c3, _0x2a7d8a),
      installMediaEventListeners(_0x29b5c3, _0x2a7d8a)),
    updateRecoveryState(_0x2a7d8a, _0x3ae755),
    _0x2a7d8a
  );
}
export async function prepareVideoForPlayback(_0x387af9, _0x4f2c2d = {}) {
  if (!_0x387af9) return false;
  const _0x3a1df4 = attachVideoPlaybackRecovery(_0x387af9, _0x4f2c2d);
  if (!(await ensureVideoSource(_0x387af9, _0x3a1df4))) return false;
  if (_0x387af9.preload !== 'auto') _0x387af9.preload = 'auto';
  return (logVideoPlaybackEvent(_0x387af9, 'prepare', { label: _0x3a1df4.label }), true);
}
export async function playVideoWithRecovery(_0x30e920, _0x26e3ad = {}) {
  if (!_0x30e920) return false;
  const _0x118120 = attachVideoPlaybackRecovery(_0x30e920, _0x26e3ad),
    _0x1f1132 = await prepareVideoForPlayback(_0x30e920, _0x26e3ad);
  if (!_0x1f1132) return false;
  if (!shouldContinuePlayback(_0x26e3ad)) return (safePause(_0x30e920), false);
  _0x26e3ad.allowConcurrent !== true && pauseOtherActiveVideos(_0x30e920);
  try {
    _0x118120.lastPlayRequestAt = Date.now();
    const _0x24b538 = _0x30e920.play?.();
    _0x24b538 && typeof _0x24b538.then === 'function' && (await _0x24b538);
  } catch (_0x284d05) {
    return (
      !isIgnorablePlayError(_0x284d05) &&
        logVideoPlaybackEvent(_0x30e920, 'play-error', {
          label: _0x118120.label,
          extra: { name: _0x284d05?.name || '', message: _0x284d05?.message || String(_0x284d05 || '') },
        }),
      false
    );
  }
  if (!shouldContinuePlayback(_0x26e3ad)) return (safePause(_0x30e920), false);
  return (
    activePlaybackVideos.add(_0x30e920),
    logVideoPlaybackEvent(_0x30e920, 'play-request', { label: _0x118120.label }),
    true
  );
}
function updateRecoveryState(_0x2a550b, _0xe5fcab) {
  if (!_0x2a550b) return;
  if (_0xe5fcab.label) _0x2a550b.label = String(_0xe5fcab.label);
  if (typeof _0xe5fcab.ensureSrc === 'function') _0x2a550b.ensureSrc = _0xe5fcab.ensureSrc;
  if (typeof _0xe5fcab.shouldRecover === 'function') _0x2a550b.shouldRecover = _0xe5fcab.shouldRecover;
  (Number.isFinite(Number(_0xe5fcab.minBufferAhead)) &&
    (_0x2a550b.minBufferAhead = Math.max(0.5, Number(_0xe5fcab.minBufferAhead))),
    Number.isFinite(Number(_0xe5fcab.readyTimeoutMs)) &&
      (_0x2a550b.readyTimeoutMs = Math.max(100, Number(_0xe5fcab.readyTimeoutMs))),
    Number.isFinite(Number(_0xe5fcab.recoveryDebounceMs)) &&
      (_0x2a550b.recoveryDebounceMs = Math.max(50, Number(_0xe5fcab.recoveryDebounceMs))),
    Number.isFinite(Number(_0xe5fcab.recoveryCooldownMs)) &&
      (_0x2a550b.recoveryCooldownMs = Math.max(100, Number(_0xe5fcab.recoveryCooldownMs))),
    Number.isFinite(Number(_0xe5fcab.startupRecoveryGraceMs)) &&
      (_0x2a550b.startupRecoveryGraceMs = Math.max(0, Number(_0xe5fcab.startupRecoveryGraceMs))),
    Number.isFinite(Number(_0xe5fcab.startupRecoveryMinPlayedSeconds)) &&
      (_0x2a550b.startupRecoveryMinPlayedSeconds = Math.max(
        0,
        Number(_0xe5fcab.startupRecoveryMinPlayedSeconds),
      )));
}
function installMediaEventListeners(_0xcf39b9, _0x46cfcb) {
  const _0xf94c02 = ['play', 'playing', 'pause', 'waiting', 'stalled', 'progress', 'canplay'];
  for (const _0x1ebe6f of _0xf94c02) {
    _0xcf39b9.addEventListener?.(_0x1ebe6f, () => {
      logVideoPlaybackEvent(_0xcf39b9, _0x1ebe6f, { label: _0x46cfcb.label });
    });
  }
  for (const _0x363acb of ['waiting', 'stalled']) {
    _0xcf39b9.addEventListener?.(_0x363acb, () => {
      scheduleStallRecovery(_0xcf39b9, _0x46cfcb, _0x363acb);
    });
  }
  (_0xcf39b9.addEventListener?.('play', () => {
    ((_0x46cfcb.lastPlayRequestAt = Date.now()), activePlaybackVideos.add(_0xcf39b9));
  }),
    _0xcf39b9.addEventListener?.('playing', () => {
      _0x46cfcb.lastPlayingAt = Date.now();
    }),
    _0xcf39b9.addEventListener?.('pause', () => activePlaybackVideos.delete(_0xcf39b9)),
    _0xcf39b9.addEventListener?.('ended', () => activePlaybackVideos.delete(_0xcf39b9)));
}
async function ensureVideoSource(_0x81160d, _0x3c7c62) {
  if (getVideoCurrentSource(_0x81160d)) return true;
  if (typeof _0x3c7c62?.ensureSrc !== 'function') return false;
  try {
    await _0x3c7c62.ensureSrc(_0x81160d);
  } catch {}
  return !!getVideoCurrentSource(_0x81160d);
}
function scheduleStallRecovery(_0x1c57f5, _0x3daa75, _0x329026) {
  if (_0x3daa75.recoveryTimer) clearTimeout(_0x3daa75.recoveryTimer);
  _0x3daa75.recoveryTimer = setTimeout(
    () => {
      ((_0x3daa75.recoveryTimer = null), void recoverStalledPlayback(_0x1c57f5, _0x3daa75, _0x329026));
    },
    Math.max(50, Number(_0x3daa75.recoveryDebounceMs || DEFAULT_RECOVERY_DEBOUNCE_MS)),
  );
}
async function recoverStalledPlayback(_0x1e938f, _0x32d2d1, _0x13efb6) {
  if (!_0x1e938f || !shouldRecoverPlayback(_0x1e938f, _0x32d2d1)) return;
  const _0xe44b06 = Date.now(),
    _0x57c714 = getStartupRecoveryDelayMs(_0x1e938f, _0x32d2d1, _0xe44b06);
  if (_0x57c714 > 0) {
    (logVideoPlaybackEvent(_0x1e938f, _0x13efb6 + '-startup-grace', {
      label: _0x32d2d1.label,
      extra: { retryInMs: _0x57c714 },
    }),
      (_0x32d2d1.recoveryTimer = setTimeout(() => {
        ((_0x32d2d1.recoveryTimer = null), void recoverStalledPlayback(_0x1e938f, _0x32d2d1, _0x13efb6));
      }, _0x57c714)));
    return;
  }
  const _0x15628a = Math.max(100, Number(_0x32d2d1.recoveryCooldownMs || DEFAULT_RECOVERY_COOLDOWN_MS));
  if (_0xe44b06 - Number(_0x32d2d1.lastRecoveryAt || 0) < _0x15628a) return;
  if (hasVideoBufferedAhead(_0x1e938f, _0x32d2d1.minBufferAhead)) return;
  if (!(await ensureVideoSource(_0x1e938f, _0x32d2d1))) return;
  _0x32d2d1.lastRecoveryAt = _0xe44b06;
  const _0x5a8654 = !!_0x1e938f.paused;
  (logVideoPlaybackEvent(_0x1e938f, _0x13efb6 + '-recovery', { label: _0x32d2d1.label }),
    await reloadVideoPreservingTime(_0x1e938f, _0x32d2d1, _0x13efb6));
  if (!_0x5a8654 && shouldRecoverPlayback(_0x1e938f, _0x32d2d1))
    try {
      const _0x52ae33 = _0x1e938f.play?.();
      _0x52ae33 && typeof _0x52ae33.catch === 'function' && _0x52ae33.catch(() => {});
    } catch {}
}
function getStartupRecoveryDelayMs(_0x29c827, _0x4ef994, _0xad911b = Date.now()) {
  const _0x40f4ac = Math.max(
    0,
    Number(_0x4ef994?.startupRecoveryGraceMs ?? DEFAULT_STARTUP_RECOVERY_GRACE_MS),
  );
  if (!(_0x40f4ac > 0)) return 0;
  const _0x567adc = Math.max(
    Number(_0x4ef994?.lastPlayRequestAt || 0),
    Number(_0x4ef994?.lastPlayingAt || 0),
  );
  if (!(_0x567adc > 0)) return 0;
  const _0x13e423 = _0xad911b - _0x567adc;
  if (_0x13e423 >= _0x40f4ac) return 0;
  const _0x1ec763 = Math.max(
    0,
    Number(_0x4ef994?.startupRecoveryMinPlayedSeconds ?? DEFAULT_STARTUP_RECOVERY_MIN_PLAYED_SECONDS),
  );
  if (Number(_0x29c827?.currentTime || 0) > _0x1ec763) return 0;
  return Math.max(50, Math.ceil(_0x40f4ac - _0x13e423));
}
function shouldRecoverPlayback(_0x33ee50, _0x25be6e) {
  if (_0x33ee50?.isConnected === false) return false;
  if (typeof _0x25be6e?.shouldRecover === 'function')
    try {
      return !!_0x25be6e.shouldRecover(_0x33ee50);
    } catch {
      return false;
    }
  return !_0x33ee50?.paused;
}
async function reloadVideoPreservingTime(_0x5de87d, _0x1a733b, _0x5cb6dd) {
  const _0x535ec6 = getVideoCurrentSource(_0x5de87d);
  if (!_0x535ec6) return;
  const _0xe1d7f9 = Number(_0x5de87d.currentTime || 0),
    _0x3fe448 = () => {
      if (!(_0xe1d7f9 > 0)) return;
      const _0x10d7ff = Number(_0x5de87d.duration),
        _0x577a3d =
          Number.isFinite(_0x10d7ff) && _0x10d7ff > 0
            ? Math.min(_0xe1d7f9, Math.max(0, _0x10d7ff - 0.05))
            : _0xe1d7f9;
      try {
        _0x5de87d.currentTime = _0x577a3d;
      } catch {}
    };
  logVideoPlaybackEvent(_0x5de87d, _0x5cb6dd + '-load', { label: _0x1a733b.label });
  try {
    if (!_0x5de87d.getAttribute?.('src') && _0x535ec6) _0x5de87d.src = _0x535ec6;
    _0x5de87d.load?.();
  } catch {}
  if (Number(_0x5de87d.readyState || 0) >= 1) _0x3fe448();
  (await waitForVideoReadiness(_0x5de87d, _0x1a733b.readyTimeoutMs), _0x3fe448());
}
function waitForVideoReadiness(_0x4c6cfd, _0x11b130) {
  if (!_0x4c6cfd || Number(_0x4c6cfd.readyState || 0) >= 2) return Promise.resolve(true);
  return new Promise((_0x343b0a) => {
    let _0x5ae578 = false;
    const _0x346d4d = ['loadeddata', 'canplay', 'canplaythrough', 'progress', 'error'],
      _0x2b7f3b = () => {
        if (_0x5ae578) return;
        ((_0x5ae578 = true), clearTimeout(_0x4ec7d9));
        for (const _0x4893c3 of _0x346d4d) {
          _0x4c6cfd.removeEventListener?.(_0x4893c3, _0x42c9b0);
        }
      },
      _0x42c9b0 = () => {
        (_0x2b7f3b(), _0x343b0a(Number(_0x4c6cfd.readyState || 0) >= 2));
      },
      _0x4ec7d9 = setTimeout(
        () => {
          (_0x2b7f3b(), _0x343b0a(Number(_0x4c6cfd.readyState || 0) >= 2));
        },
        Math.max(100, Number(_0x11b130 || DEFAULT_READY_TIMEOUT_MS)),
      );
    for (const _0x9779a1 of _0x346d4d) {
      _0x4c6cfd.addEventListener?.(_0x9779a1, _0x42c9b0);
    }
  });
}
function shouldContinuePlayback(_0x199c1a) {
  if (typeof _0x199c1a.shouldContinue !== 'function') return true;
  try {
    return !!_0x199c1a.shouldContinue();
  } catch {
    return false;
  }
}
function safePause(_0x271aa1) {
  try {
    _0x271aa1?.pause?.();
  } catch {}
}
function pauseOtherActiveVideos(_0x2adc2a) {
  for (const _0x1846c2 of Array.from(activePlaybackVideos)) {
    if (!_0x1846c2 || _0x1846c2 === _0x2adc2a) continue;
    if (_0x1846c2.isConnected === false) {
      activePlaybackVideos.delete(_0x1846c2);
      continue;
    }
    (safePause(_0x1846c2), activePlaybackVideos.delete(_0x1846c2));
  }
}
export function __resetVideoPlaybackRecoveryForTest() {
  activePlaybackVideos.clear();
}
function isIgnorablePlayError(_0x28dd4d) {
  const _0xc40be0 = _0x28dd4d && typeof _0x28dd4d === 'object' ? _0x28dd4d.name : '',
    _0x141091 =
      _0x28dd4d && typeof _0x28dd4d === 'object' ? String(_0x28dd4d.message || '') : String(_0x28dd4d || '');
  return _0xc40be0 === 'AbortError' || _0x141091.includes('interrupted by a call to pause');
}
