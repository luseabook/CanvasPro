function normalizeDelay(value, item) {
  const count = Number(value);
  return Number['isFinite'](count) && count >= 0 ? count : item;
}
function getErrorMessage(error2) {
  return String(error2?.['message'] || error2 || '自动保存失败')['trim']() || '自动保存失败';
}
export function createWorkspacePersistenceCoordinator({
  save: save,
  getSnapshot: getSnapshot,
  ready: ready = true,
  debounceMs: debounceMs = 500,
  maxWaitMs: maxWaitMs = 0,
  retryBaseMs: retryBaseMs = 1000,
  retryMaxMs: retryMaxMs = 10000,
  setTimeoutFn: setTimeoutFn = globalThis['setTimeout']?.['bind'](globalThis),
  clearTimeoutFn: clearTimeoutFn = globalThis['clearTimeout']?.['bind'](globalThis),
  onStateChange: onStateChange = () => {},
  onError: onError = () => {},
} = {}) {
  const status = typeof save === 'function' && typeof getSnapshot === 'function',
    delay = normalizeDelay(debounceMs, 500),
    delay2 = normalizeDelay(maxWaitMs, 0),
    delay3 = normalizeDelay(retryBaseMs, 1000),
    key = Math['max'](delay3, normalizeDelay(retryMaxMs, 10000));
  let enabled = ready === true,
    enabled2 = false,
    setTimeoutFn2 = 0,
    setTimeoutFn3 = 0,
    value2 = null,
    setTimeoutFn4 = 0,
    index = 0,
    result = 0,
    attempt2 = 0,
    data = null,
    options = null,
    response = { status: status ? 'saved' : 'idle', error: '', retryAttempt: 0 };
  const run = (status2, { error: error = '', attempt: attempt = attempt2 } = {}) => {
      return (
        (response = {
          status: status2,
          error: String(error || '')['trim'](),
          retryAttempt: Math['max'](0, Math['trunc'](Number(attempt) || 0)),
        }),
        onStateChange({ ...response }),
        response
      );
    },
    handler = () => {
      (setTimeoutFn2 && typeof clearTimeoutFn === 'function' && clearTimeoutFn(setTimeoutFn2),
        (setTimeoutFn2 = 0));
    },
    handler2 = () => {
      (setTimeoutFn4 && typeof clearTimeoutFn === 'function' && clearTimeoutFn(setTimeoutFn4),
        (setTimeoutFn4 = 0));
    },
    handler3 = () => {
      handler();
      if (setTimeoutFn3) clearTimeoutFn?.(setTimeoutFn3);
      ((setTimeoutFn3 = 0), (value2 = null));
    },
    handler4 = (target) => {
      ((attempt2 += 1), run('error', { error: getErrorMessage(target), attempt: attempt2 }));
      if (enabled2 || !enabled || !status || setTimeoutFn4 || typeof setTimeoutFn !== 'function') return;
      const source = Math['min'](delay3 * 2 ** Math['max'](0, attempt2 - 1), key);
      setTimeoutFn4 =
        setTimeoutFn(() => {
          ((setTimeoutFn4 = 0), void flush()['catch'](onError));
        }, source) || 0;
    },
    handler5 = ({ allowStopped: allowStopped = false } = {}) => {
      if (!enabled || !status || (enabled2 && !allowStopped)) return Promise['resolve'](options);
      (handler3(), handler2());
      if (data) return data;
      const run2 = async () => {
          while (result < index) {
            handler3();
            const next = index;
            let current = false;
            try {
              const entry = getSnapshot();
              ((current = true), run('saving', { attempt: attempt2 }), (options = await save(entry)));
            } catch (record) {
              handler3();
              current
                ? handler4(record)
                : ((attempt2 = 0), run('error', { error: getErrorMessage(record), attempt: 0 }));
              throw record;
            }
            ((result = next), (attempt2 = 0), result >= index && run('saved'));
          }
          return options;
        },
        payload = run2()['finally'](() => {
          if (data === payload) data = null;
        });
      return ((data = payload), payload);
    };
  function flush({ force: force = false } = {}) {
    return (
      force && status && !enabled2 && index <= result && ((index = result + 1), run('pending')),
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
            ((setTimeoutFn2 = 0), void flush()['catch'](onError));
          }, value2) || 0),
        !setTimeoutFn3 &&
          delay2 > 0 &&
          (setTimeoutFn3 =
            setTimeoutFn(() => {
              ((setTimeoutFn3 = 0), void flush()['catch'](onError));
            }, delay2) || 0));
    },
    schedule = ({ immediate: immediate = false, delayMs: delayMs = delay } = {}) => {
      if (enabled2) return index;
      index += 1;
      if (status && !['error', 'saving']['includes'](response['status'])) run('pending');
      if (!enabled || !status) return index;
      return (
        immediate ? (handler(), void flush()['catch'](onError)) : run3(normalizeDelay(delayMs, delay)),
        index
      );
    },
    setReady = (state = true, { immediate: immediate = false } = {}) => {
      enabled = state === true;
      if (!enabled || enabled2 || index <= result) return;
      immediate ? void flush()['catch'](onError) : run3();
    },
    setHydrationError = (config) => {
      ((enabled = false),
        (attempt2 = 0),
        handler3(),
        handler2(),
        run('error', { error: getErrorMessage(config), attempt: 0 }));
    },
    destroy = async ({ flush: flush2 = true, force: force = false } = {}) => {
      if (enabled2) return data || options;
      (handler3(), handler2());
      force && status && index <= result && ((index = result + 1), run('pending'));
      enabled2 = true;
      if (!flush2 || !enabled || !status) return data || options;
      try {
        return await handler5({ allowStopped: true });
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
