export function formatAudioTime(value) {
  const count = Number(value);
  if (!Number.isFinite(count) || count <= 0) return '0:00';
  return Math.floor(count / 60) + ':' + String(Math.floor(count % 60)).padStart(2, '0');
}
function clamp01(item) {
  const key = Number(item);
  if (!Number.isFinite(key)) return 0;
  return Math.max(0, Math.min(1, key));
}
function getRafFns(options = {}) {
  const requestFrame =
      options.requestFrame ||
      (typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
          ? window.requestAnimationFrame.bind(window)
          : null),
    cancelFrame =
      options.cancelFrame ||
      (typeof cancelAnimationFrame === 'function'
        ? cancelAnimationFrame
        : typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function'
          ? window.cancelAnimationFrame.bind(window)
          : null);
  return {
    requestFrame: requestFrame || ((index) => setTimeout(index, 16)),
    cancelFrame: cancelFrame || ((result) => clearTimeout(result)),
  };
}
export function createAudioPlaybackProgressController(options2 = {}) {
  const {
      audioEl: audioEl,
      wavePlayedEl: wavePlayedEl,
      progressLineEl: progressLineEl,
      timeEl: timeEl,
      trackEl: trackEl,
      formatTime: formatTime = formatAudioTime,
      shouldSuppressSync: shouldSuppressSync = () => false,
    } = options2,
    { requestFrame: requestFrame2, cancelFrame: cancelFrame2 } = getRafFns(options2);
  let value2 = null,
    data = false,
    target = false,
    source = 0,
    resizeObserver = null,
    next = '',
    current = '',
    entry = '',
    showLine2 = '';
  const run = () => {
      const count2 =
        Number(trackEl?.clientWidth) ||
        Number(trackEl?.getBoundingClientRect?.().width) ||
        Number(progressLineEl?.parentElement?.clientWidth) ||
        0;
      if (Number.isFinite(count2) && count2 > 0) source = count2;
      return source;
    },
    handler = () => {
      return !!audioEl && audioEl.paused === false && audioEl.ended !== true;
    },
    handler2 = (record) => {
      if (!progressLineEl || showLine2 === record) return;
      ((progressLineEl.style.opacity = record), (showLine2 = record));
    },
    hideLine = () => {
      handler2('0');
    },
    sync = ({
      currentTime: currentTime = audioEl?.currentTime,
      duration: duration = audioEl?.duration,
      force: force = false,
      showLine: showLine = true,
    } = {}) => {
      const count3 = Number(duration);
      if (!Number.isFinite(count3) || count3 <= 0) return false;
      const payload = Number(currentTime),
        clamp012 = clamp01(payload / count3),
        handle = (clamp012 * 100).toFixed(2);
      wavePlayedEl &&
        (force || next !== handle) &&
        (wavePlayedEl.style.clipPath = 'inset(0 0 0 ' + handle + '%)');
      if (progressLineEl && (force || next !== handle)) {
        const count4 = run();
        if (count4 > 0) {
          const state = (clamp012 * count4).toFixed(2) + 'px';
          (force || entry !== state) &&
            ((progressLineEl.style.left = '0'),
            (progressLineEl.style.transform = 'translateX(' + state + ')'),
            (entry = state));
        } else {
          const config = handle + '%';
          (force || entry !== config) &&
            ((progressLineEl.style.left = config), (progressLineEl.style.transform = ''), (entry = config));
        }
      }
      if (showLine) handler2('1');
      const formatTime2 = formatTime(payload) + ' / ' + formatTime(count3);
      return (
        timeEl &&
          (force || current !== formatTime2) &&
          ((timeEl.textContent = formatTime2), (current = formatTime2)),
        (next = handle),
        true
      );
    },
    start = () => {
      if (data || value2 !== null) return;
      value2 = requestFrame2(scope);
    },
    stop = () => {
      if (value2 === null) return;
      (cancelFrame2(value2), (value2 = null));
    },
    scope = () => {
      value2 = null;
      if (data || !handler()) return;
      (!shouldSuppressSync() && sync({ showLine: true }), start());
    },
    input = () => {
      start();
    },
    output = () => {
      stop();
      if (data || shouldSuppressSync()) return;
      if (audioEl?.ended === true) {
        (sync({ force: true, showLine: false }), hideLine());
        return;
      }
      sync({ showLine: true });
    },
    value3 = () => {
      if (data || handler() || shouldSuppressSync()) return;
      sync({ showLine: true });
    },
    value4 = () => {
      if (data) return;
      const currentTime2 = Number(audioEl?.currentTime || 0);
      sync({
        currentTime: currentTime2,
        duration: audioEl?.duration,
        force: true,
        showLine: currentTime2 > 0,
      });
      if (currentTime2 <= 0) hideLine();
    },
    value5 = () => {
      (stop(), sync({ force: true, showLine: false }), hideLine());
    },
    attach = () => {
      if (target || !audioEl?.addEventListener) return value6;
      ((target = true), (data = false), run());
      typeof ResizeObserver === 'function' &&
        trackEl &&
        typeof trackEl === 'object' &&
        ((resizeObserver = new ResizeObserver(() => {
          (run(), sync({ force: true, showLine: showLine2 === '1' }));
        })),
        resizeObserver.observe(trackEl));
      (audioEl.addEventListener('play', input),
        audioEl.addEventListener('pause', output),
        audioEl.addEventListener('timeupdate', value3),
        audioEl.addEventListener('loadedmetadata', value4),
        audioEl.addEventListener('durationchange', value4),
        audioEl.addEventListener('ended', value5));
      if (handler()) start();
      return value6;
    },
    reset = ({ hide: hide = true } = {}) => {
      ((next = ''), (current = ''), (entry = ''));
      if (wavePlayedEl) wavePlayedEl.style.clipPath = 'inset(0 0 0 0)';
      progressLineEl &&
        ((progressLineEl.style.left = '0'), (progressLineEl.style.transform = 'translateX(0px)'));
      if (hide) hideLine();
      timeEl && ((timeEl.textContent = '0:00 / 0:00'), (current = '0:00 / 0:00'));
    },
    destroy = () => {
      ((data = true),
        stop(),
        target &&
          audioEl?.removeEventListener &&
          (audioEl.removeEventListener('play', input),
          audioEl.removeEventListener('pause', output),
          audioEl.removeEventListener('timeupdate', value3),
          audioEl.removeEventListener('loadedmetadata', value4),
          audioEl.removeEventListener('durationchange', value4),
          audioEl.removeEventListener('ended', value5)),
        (target = false),
        resizeObserver && (resizeObserver.disconnect(), (resizeObserver = null)));
    },
    value6 = {
      attach: attach,
      destroy: destroy,
      reset: reset,
      hideLine: hideLine,
      start: start,
      stop: stop,
      sync: sync,
      isRunning: () => value2 !== null,
    };
  return value6;
}
