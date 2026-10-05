export const LEGACY_STORAGE_MIGRATION_TIMEOUT_MS = 20000;
export function createMigrationDeadline(value = LEGACY_STORAGE_MIGRATION_TIMEOUT_MS) {
  const abortController = new AbortController(),
    item = Object['assign'](new Error('Legacy storage migration timed out'), {
      code: 'LEGACY_STORAGE_MIGRATION_TIMEOUT',
    }),
    setTimeout2 = setTimeout(() => abortController['abort'](item), Math['max'](1, value)),
    { signal: signal } = abortController;
  return {
    signal: signal,
    dispose: () => clearTimeout(setTimeout2),
    wait(handler) {
      return (
        signal['throwIfAborted'](),
        new Promise((key, handler2) => {
          const index = () => handler2(signal['reason']);
          (signal['addEventListener']('abort', index, { once: true }),
            Promise['resolve']()
              ['then'](() => {
                return (signal['throwIfAborted'](), handler());
              })
              ['then'](key, handler2)
              ['finally'](() => signal['removeEventListener']('abort', index)));
        })
      );
    },
  };
}
