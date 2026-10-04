function normalizeDelay(value, item) {
  const count = Number(value);
  return Number['isFinite'](count) && count >= 0x0 ? count : item;
}
function getErrorMessage(error2) {
  return String(error2?.['message'] || error2 || '自动保存失败')['trim']() || '自动保存失败';
}
export function createWorkspacePersistenceCoordinator({
  save: save,
  getSnapshot: getSnapshot,
  ready: ready = !![],
  debounceMs: debounceMs = 0x1f4,
  maxWaitMs: maxWaitMs = 0x0,
  retryBaseMs: retryBaseMs = 0x3e8,
  retryMaxMs: retryMaxMs = 0x2710,
  setTimeoutFn: setTimeoutFn = globalThis['setTimeout']?.['bind'](globalThis),
  clearTimeoutFn: clearTimeoutFn = globalThis['clearTimeout']?.['bind'](globalThis),
  onStateChange: onStateChange = () => {},
  onError: onError = () => {},
} = {}) {
  const status = typeof save === 'function' && typeof getSnapshot === 'function',
    delay = normalizeDelay(debounceMs, 0x1f4),
    delay2 = normalizeDelay(maxWaitMs, 0x0),
    delay3 = normalizeDelay(retryBaseMs, 0x3e8),
    key = Math['max'](delay3, normalizeDelay(retryMaxMs, 0x2710));
  let enabled = ready === !![],
    enabled2 = ![],
    setTimeoutFn2 = 0x0,
    setTimeoutFn3 = 0x0,
    value2 = null,
    setTimeoutFn4 = 0x0,
    index = 0x0,
    result = 0x0,
    attempt2 = 0x0,
    data = null,
    options = null,
    response = { status: status ? 'saved' : 'idle', error: '', retryAttempt: 0x0 };
  const run = (status2, { error: error = '', attempt: attempt = attempt2 } = {}) => {
      return (
        (response = {
          status: status2,
          error: String(error || '')['trim'](),
          retryAttempt: Math['max'](0x0, Math['trunc'](Number(attempt) || 0x0)),
        }),
        onStateChange({ ...response }),
        response
      );
    },
    handler = () => {
      (setTimeoutFn2 && typeof clearTimeoutFn === 'function' && clearTimeoutFn(setTimeoutFn2),
        (setTimeoutFn2 = 0x0));
    },
    handler2 = () => {
      (setTimeoutFn4 && typeof clearTimeoutFn === 'function' && clearTimeoutFn(setTimeoutFn4),
        (setTimeoutFn4 = 0x0));
    },
    handler3 = () => {
      handler();
      if (setTimeoutFn3) clearTimeoutFn?.(setTimeoutFn3);
      ((setTimeoutFn3 = 0x0), (value2 = null));
    },
    handler4 = (target) => {
      ((attempt2 += 0x1), run('error', { error: getErrorMessage(target), attempt: attempt2 }));
      if (enabled2 || !enabled || !status || setTimeoutFn4 || typeof setTimeoutFn !== 'function') return;
      const source = Math['min'](delay3 * 0x2 ** Math['max'](0x0, attempt2 - 0x1), key);
      setTimeoutFn4 =
        setTimeoutFn(() => {
          ((setTimeoutFn4 = 0x0), void flush()['catch'](onError));
        }, source) || 0x0;
    },
    handler5 = ({ allowStopped: allowStopped = ![] } = {}) => {
      if (!enabled || !status || (enabled2 && !allowStopped)) return Promise['resolve'](options);
      (handler3(), handler2());
      if (data) return data;
      const run2 = async () => {
          while (result < index) {
            handler3();
            const next = index;
            let current = ![];
            try {
              const entry = getSnapshot();
              ((current = !![]), run('saving', { attempt: attempt2 }), (options = await save(entry)));
            } catch (record) {
              handler3();
              current
                ? handler4(record)
                : ((attempt2 = 0x0), run('error', { error: getErrorMessage(record), attempt: 0x0 }));
              throw record;
            }
            ((result = next), (attempt2 = 0x0), result >= index && run('saved'));
          }
          return options;
        },
        payload = run2()['finally'](() => {
          if (data === payload) data = null;
        });
      return ((data = payload), payload);
    };
  function flush({ force: force = ![] } = {}) {
    return (
      force && status && !enabled2 && index <= result && ((index = result + 0x1), run('pending')),
      handler5()
    );
  }
  const run3 = (handle = delay) => {
      if (!enabled || enabled2 || !status || setTimeoutFn4 || typeof setTimeoutFn !== 'function') return;
      if (setTimeoutFn2 && value2 !== null && handle > value2) return;
      ((value2 = value2 === null ? handle : Math['min'](value2, handle)),
        handler(),
        (setTimeoutFn2 =
          setTimeoutFn(() => {
            ((setTimeoutFn2 = 0x0), void flush()['catch'](onError));
          }, value2) || 0x0),
        !setTimeoutFn3 &&
          delay2 > 0x0 &&
          (setTimeoutFn3 =
            setTimeoutFn(() => {
              ((setTimeoutFn3 = 0x0), void flush()['catch'](onError));
            }, delay2) || 0x0));
    },
    schedule = ({ immediate: immediate = ![], delayMs: delayMs = delay } = {}) => {
      if (enabled2) return index;
      index += 0x1;
      if (status && !['error', 'saving']['includes'](response['status'])) run('pending');
      if (!enabled || !status) return index;
      return (
        immediate ? (handler(), void flush()['catch'](onError)) : run3(normalizeDelay(delayMs, delay)),
        index
      );
    },
    setReady = (state = !![], { immediate: immediate = ![] } = {}) => {
      enabled = state === !![];
      if (!enabled || enabled2 || index <= result) return;
      immediate ? void flush()['catch'](onError) : run3();
    },
    setHydrationError = (config) => {
      ((enabled = ![]),
        (attempt2 = 0x0),
        handler3(),
        handler2(),
        run('error', { error: getErrorMessage(config), attempt: 0x0 }));
    },
    destroy = async ({ flush: flush2 = !![], force: force = ![] } = {}) => {
      if (enabled2) return data || options;
      (handler3(), handler2());
      force && status && index <= result && ((index = result + 0x1), run('pending'));
      enabled2 = !![];
      if (!flush2 || !enabled || !status) return data || options;
      try {
        return await handler5({ allowStopped: !![] });
      } finally {
        (handler(), handler2());
      }
    };
  return Object['freeze']({
    schedule: schedule,
    flush: flush,
    setReady: setReady,
    setHydrationError: setHydrationError,
    destroy: destroy,
    getRevision: () => index,
    getPersistedRevision: () => result,
    getState: () => ({ ...response }),
    isReady: () => enabled,
    isDirty: () => index > result,
  });
}
