export const LEGACY_STORAGE_MIGRATION_TIMEOUT_MS = 0x4e20;
export function createMigrationDeadline(_0x38d40b = LEGACY_STORAGE_MIGRATION_TIMEOUT_MS) {
  const _0x2f61b6 = new AbortController(),
    _0x42e8e3 = Object['assign'](new Error('Legacy storage migration timed out'), {
      code: 'LEGACY_STORAGE_MIGRATION_TIMEOUT',
    }),
    _0x9a087b = setTimeout(() => _0x2f61b6['abort'](_0x42e8e3), Math['max'](0x1, _0x38d40b)),
    { signal: _0x54b863 } = _0x2f61b6;
  return {
    signal: _0x54b863,
    dispose: () => clearTimeout(_0x9a087b),
    wait(_0x528114) {
      return (
        _0x54b863['throwIfAborted'](),
        new Promise((_0x304feb, _0x38f213) => {
          const _0x1b9383 = () => _0x38f213(_0x54b863['reason']);
          (_0x54b863['addEventListener']('abort', _0x1b9383, { once: !![] }),
            Promise['resolve']()
              ['then'](() => {
                return (_0x54b863['throwIfAborted'](), _0x528114());
              })
              ['then'](_0x304feb, _0x38f213)
              ['finally'](() => _0x54b863['removeEventListener']('abort', _0x1b9383)));
        })
      );
    },
  };
}
