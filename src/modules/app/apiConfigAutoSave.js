export function createApiConfigAutoSaveController({
  beforePersist: beforePersist,
  collectConfig: collectConfig,
  saveConfig: saveConfig,
  onSaved: onSaved,
  onError: onError,
  onStateChange: onStateChange,
  timerHost: timerHost = globalThis.window || globalThis,
  delay: delay = 600,
} = {}) {
  let value = null,
    item = 0,
    promise = Promise.resolve(),
    count = 0;
  function run() {
    if (value === null) return;
    (timerHost.clearTimeout(value), (value = null));
  }
  function persist(options = {}) {
    run();
    const key = ++item;
    ((count += 1), onStateChange?.('saving'));
    const promise2 = promise.then(async () => {
      try {
        await beforePersist?.();
        const index = collectConfig();
        return (
          await saveConfig(index),
          key === item && (onSaved?.(index, options), onStateChange?.('saved')),
          index
        );
      } catch (result) {
        return (key === item && (onError?.(result, options), onStateChange?.('error')), null);
      } finally {
        count -= 1;
        if (count === 0 && value !== null) onStateChange?.('scheduled');
      }
    });
    return (
      (promise = promise2.then(
        () => null,
        () => null,
      )),
      promise2
    );
  }
  function schedule() {
    (run(),
      (item += 1),
      onStateChange?.(count ? 'saving' : 'scheduled'),
      (value = timerHost.setTimeout(() => {
        ((value = null), persist().catch(() => {}));
      }, delay)));
  }
  function flush() {
    return value === null ? promise : persist();
  }
  return { persist: persist, schedule: schedule, flush: flush };
}
