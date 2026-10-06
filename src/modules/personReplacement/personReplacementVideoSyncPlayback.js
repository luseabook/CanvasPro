function normalizeText(value, item = '') {
  const key = String(value ?? '').trim();
  return key || item;
}
export function createPersonReplacementVideoSyncPlayback({
  sourceVideo: sourceVideo,
  resultVideo: resultVideo,
  sourcePlay: sourcePlay = () => sourceVideo?.play?.(),
  resultPlay: resultPlay = () => resultVideo?.play?.(),
  button: button = null,
  driftToleranceSec: driftToleranceSec = 0.08,
  initiallyEnabled: initiallyEnabled = false,
  onEnabledChange: onEnabledChange = null,
} = {}) {
  if (!sourceVideo || !resultVideo) throw new Error('同步播放需要原视频和替换结果视频');
  const index = Math.max(0.02, Number(driftToleranceSec) || 0.08);
  let enabled = false,
    enabled2 = initiallyEnabled === true,
    enabled3 = false,
    enabled4 = false,
    enabled5 = false,
    enabled6 = false,
    result = 'result';
  const run = (data) => data?.paused === false && data?.ended !== true,
    handler = (options) => (options === 'source' ? sourceVideo : resultVideo),
    handler2 = (target) => (target === 'source' ? sourcePlay : resultPlay),
    handler3 = (source) => {
      const count = Number(source?.currentTime);
      return Number.isFinite(count) && count > 0 ? count : 0;
    },
    handler4 = (next, current) => {
      const count2 = Number(next?.duration),
        entry =
          Number.isFinite(count2) && count2 > 0 ? count2 : Math.max(0, Number(current) || 0);
      return Math.max(0, Math.min(entry, Number(current) || 0));
    },
    handler5 = (record, payload, { force: force = false } = {}) => {
      const handle = handler4(record, payload);
      if (!force && Math.abs(handler3(record) - handle) <= index) return false;
      try {
        return ((record.currentTime = handle), true);
      } catch {
        return false;
      }
    },
    handler6 = () => {
      const state = enabled2 && !enabled;
      (button?.classList?.toggle?.('is-active', state),
        button?.setAttribute?.('aria-pressed', String(state)),
        button?.setAttribute?.('aria-label', state ? '关闭同步播放' : '开启同步播放'));
    },
    handler7 = () => {
      if (typeof onEnabledChange !== 'function') return;
      try {
        onEnabledChange(enabled2);
      } catch {}
    },
    handler8 = ({ force: force = false } = {}) => {
      const config = result === 'source' ? 'result' : 'source',
        scope = handler(result),
        input = handler(config);
      enabled6 = true;
      const output = handler5(input, handler3(scope), { force: force });
      return ((enabled6 = false), output);
    },
    pause = () => {
      ((enabled3 = false), (enabled5 = false));
      if (enabled4) return;
      enabled4 = true;
      if (sourceVideo.paused === false) sourceVideo.pause?.();
      if (resultVideo.paused === false) resultVideo.pause?.();
      ((enabled4 = false), handler6());
    },
    handler9 = () => {
      if (enabled || enabled4 || !enabled3 || enabled5) {
        handler6();
        return;
      }
      pause();
    },
    handler10 = (value2, value3) => {
      if (!enabled2 || enabled || enabled6) return;
      if (value3?.type === 'seeking') result = value2;
      if (!enabled3) return;
      if (enabled5) {
        handler6();
        return;
      }
      if (!run(sourceVideo) || !run(resultVideo)) {
        handler9();
        return;
      }
      if (value2 === result) handler8();
      handler6();
    },
    list = ['playing', 'timeupdate', 'seeking', 'seeked'],
    list2 = ['pause', 'ended', 'emptied'],
    list3 = [
      ['source', sourceVideo],
      ['result', resultVideo],
    ].map(([value4, video]) => {
      const onProgress = (value5) => handler10(value4, value5);
      return (
        list.forEach((value6) => {
          video.addEventListener?.(value6, onProgress);
        }),
        list2.forEach((value7) => {
          video.addEventListener?.(value7, handler9);
        }),
        { video: video, onProgress: onProgress }
      );
    });
  handler6();
  const run2 = async (value8 = 'result') => {
    if (enabled || !enabled2) return false;
    result = value8 === 'source' ? 'source' : 'result';
    const value9 = handler(result),
      force2 = sourceVideo.ended === true || resultVideo.ended === true,
      value10 = force2 ? 0 : handler3(value9);
    (handler5(value9, value10, { force: force2 }),
      handler8({ force: true }),
      (enabled3 = true),
      (enabled5 = true));
    const list4 = await Promise.allSettled([
      Promise.resolve().then(() => handler2('source')()),
      Promise.resolve().then(() => handler2('result')()),
    ]);
    enabled5 = false;
    if (
      enabled ||
      !enabled2 ||
      !enabled3 ||
      list4.some((response) => response.status === 'rejected') ||
      !run(sourceVideo) ||
      !run(resultVideo)
    )
      return (pause(), false);
    return (handler8({ force: true }), handler6(), true);
  };
  return Object.freeze({
    async toggleEnabled() {
      if (enabled) return false;
      ((enabled2 = !enabled2), handler6(), handler7());
      if (!enabled2) return ((enabled3 = false), false);
      if (run(sourceVideo) || run(resultVideo)) {
        const value11 = run(resultVideo) ? 'result' : 'source';
        await run2(value11);
      }
      return enabled2;
    },
    async togglePlayback({ master: master = 'result' } = {}) {
      if (enabled || !enabled2) return false;
      if (run(sourceVideo) || run(resultVideo)) return (pause(), false);
      return run2(master);
    },
    pause: pause,
    isEnabled: () => enabled2 && !enabled,
    isPlayingTogether: () => enabled3 && !enabled,
    destroy() {
      if (enabled) return;
      if (enabled3) pause();
      ((enabled2 = false),
        (enabled = true),
        list3.forEach(({ video: video2, onProgress: onProgress2 }) => {
          (list.forEach((value12) => {
            video2.removeEventListener?.(value12, onProgress2);
          }),
            list2.forEach((value13) => {
              video2.removeEventListener?.(value13, handler9);
            }));
        }),
        handler6());
    },
  });
}
export function shouldReusePersonReplacementVideoPlaybackStage(el, el2) {
  const text = normalizeText(el?.dataset?.personReplacementVideoPlaybackStage),
    text2 = normalizeText(el2?.dataset?.personReplacementVideoPlaybackStage),
    text3 = normalizeText(el?.dataset?.personReplacementVideoUrl),
    text4 = normalizeText(el2?.dataset?.personReplacementVideoUrl),
    value14 = ['personReplacementVideoPoster', 'personReplacementVideoReversed'].every(
      (value15) => normalizeText(el?.dataset?.[value15]) === normalizeText(el2?.dataset?.[value15]),
    );
  return Boolean(text && text === text2 && text3 && text3 === text4 && value14);
}
