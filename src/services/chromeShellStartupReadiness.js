export const CHROME_SHELL_STARTUP_READY_EVENT = 'renderer.chrome_shell_startup_ready';
export const CHROME_SHELL_STARTUP_FAILED_EVENT = 'renderer.chrome_shell_startup_failed';
export const DEFAULT_CHROME_SHELL_STARTUP_READY_DELAY_MS = 0x5dc;
export const CHROME_SHELL_STARTUP_ATTEMPT_ID_PARAM = 'aicStartupAttemptId';
export const CHROME_SHELL_STARTUP_READY_TIMEOUT_MS_PARAM = 'aicStartupReadyTimeoutMs';
const MIN_STARTUP_ATTEMPT_ID_LENGTH = 0x10,
  MAX_STARTUP_ATTEMPT_ID_LENGTH = 0x80,
  MIN_STARTUP_READY_TIMEOUT_MS = 0x3e8,
  MAX_STARTUP_READY_TIMEOUT_MS = 0x1d4c0,
  MAX_PENDING_READY_REPORTS = 0x2,
  LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);
export function isChromeShellRuntimeHref(value) {
  try {
    const uRL = new URL(String(value || ''));
    return (
      LOOPBACK_HOSTS['has'](uRL['hostname']) && uRL['searchParams']['get']('aicRuntime') === 'chrome-shell'
    );
  } catch {
    return ![];
  }
}
export function isChromeShellStartupAttemptId(item) {
  if (typeof item !== 'string') return ![];
  const list = item;
  return (
    list['length'] >= MIN_STARTUP_ATTEMPT_ID_LENGTH &&
    list['length'] <= MAX_STARTUP_ATTEMPT_ID_LENGTH &&
    /^[A-Za-z0-9_-]+$/['test'](list)
  );
}
function normalizeStartupReadyTimeoutMs(key) {
  const index = Number(key);
  if (
    !Number['isInteger'](index) ||
    index < MIN_STARTUP_READY_TIMEOUT_MS ||
    index > MAX_STARTUP_READY_TIMEOUT_MS
  )
    return null;
  return index;
}
function readNavigationElapsedMs(result) {
  try {
    const count = Number(result?.['performance']?.['now']?.());
    return Number['isFinite'](count) && count >= 0x0 ? count : null;
  } catch {
    return null;
  }
}
export function buildChromeShellStartupMetadataUrl(
  data,
  { startupAttemptId: startupAttemptId, readyTimeoutMs: readyTimeoutMs } = {},
) {
  if (!isChromeShellStartupAttemptId(startupAttemptId))
    throw new TypeError('Invalid Chrome shell startup attempt id');
  const startupReadyTimeoutMs = normalizeStartupReadyTimeoutMs(readyTimeoutMs);
  if (startupReadyTimeoutMs == null) throw new RangeError('Invalid Chrome shell startup ready timeout');
  const uRL2 = new URL(String(data || ''));
  return (
    uRL2['searchParams']['set'](CHROME_SHELL_STARTUP_ATTEMPT_ID_PARAM, startupAttemptId),
    uRL2['searchParams']['set'](CHROME_SHELL_STARTUP_READY_TIMEOUT_MS_PARAM, String(startupReadyTimeoutMs)),
    uRL2['href']
  );
}
export function readChromeShellStartupMetadata(options) {
  if (!isChromeShellRuntimeHref(options)) return null;
  try {
    const uRL3 = new URL(String(options || '')),
      startupAttemptId2 = String(uRL3['searchParams']['get'](CHROME_SHELL_STARTUP_ATTEMPT_ID_PARAM) || ''),
      target = String(uRL3['searchParams']['get'](CHROME_SHELL_STARTUP_READY_TIMEOUT_MS_PARAM) || ''),
      readyTimeoutMs2 = /^(?:[1-9]\d*)$/['test'](target) ? normalizeStartupReadyTimeoutMs(target) : null;
    if (!isChromeShellStartupAttemptId(startupAttemptId2) || readyTimeoutMs2 == null) return null;
    return { startupAttemptId: startupAttemptId2, readyTimeoutMs: readyTimeoutMs2 };
  } catch {
    return null;
  }
}
export function scheduleChromeShellStartupReady({
  windowObject: windowObject = globalThis['window'],
  diagnostics: diagnostics,
  delayMs: delayMs = DEFAULT_CHROME_SHELL_STARTUP_READY_DELAY_MS,
  retryDelayMs: retryDelayMs = 0x2ee,
  maxAttempts: maxAttempts,
  setTimeoutFn: setTimeoutFn = setTimeout,
} = {}) {
  const href = String(windowObject?.['location']?.['href'] || ''),
    readyTimeoutMs3 = readChromeShellStartupMetadata(href);
  if (!readyTimeoutMs3) return null;
  if (typeof diagnostics?.['logEvent'] !== 'function') return null;
  const source = Math['max'](0x64, Math['min'](0x1388, Number(retryDelayMs) || 0x0)),
    next = Math['max'](0x0, Math['min'](0x2710, Number(delayMs) || 0x0)),
    navigationElapsedMs = Math['min'](
      readyTimeoutMs3['readyTimeoutMs'] - 0x1,
      Math['max'](0x0, readNavigationElapsedMs(windowObject) || 0x0),
    ),
    remainingTimeoutMs = Math['max'](0x1, readyTimeoutMs3['readyTimeoutMs'] - navigationElapsedMs),
    current = Math['min'](next, Math['max'](0x0, remainingTimeoutMs - source)),
    entry = Math['max'](0x1, Math['ceil']((remainingTimeoutMs - current) / source)),
    record =
      maxAttempts == null
        ? entry
        : Math['min'](entry, Math['max'](0x1, Math['round'](Number(maxAttempts) || 0x0)));
  let payload = ![],
    handle = 0x0,
    state = 0x0,
    config = ![];
  windowObject?.['addEventListener']?.(
    'pagehide',
    () => {
      config = !![];
    },
    { once: !![] },
  );
  function run(scope) {
    if (scope >= entry || state >= record) return;
    void Promise['resolve']()['then'](() => {
      if (payload || config || state >= record) return;
      setTimeoutFn(() => run2(scope + 0x1), source);
    });
  }
  function run2(input) {
    if (payload || config || input > entry) return;
    const navigationElapsedMs2 = readNavigationElapsedMs(windowObject);
    if (navigationElapsedMs2 != null && navigationElapsedMs2 >= readyTimeoutMs3['readyTimeoutMs']) return;
    if (handle >= MAX_PENDING_READY_REPORTS || state >= record) {
      run(input);
      return;
    }
    const attempt = state + 0x1;
    state = attempt;
    let output;
    try {
      output = diagnostics['logEvent']({
        type: CHROME_SHELL_STARTUP_READY_EVENT,
        level: 'info',
        source: 'renderer',
        message: 'Chrome shell renderer completed startup',
        context: {
          attempt: attempt,
          href: href,
          navigationElapsedMs: navigationElapsedMs,
          readyTimeoutMs: readyTimeoutMs3['readyTimeoutMs'],
          remainingTimeoutMs: remainingTimeoutMs,
          startupAttemptId: readyTimeoutMs3['startupAttemptId'],
          userAgent: String(windowObject?.['navigator']?.['userAgent'] || ''),
        },
      });
    } catch {
      output = null;
    }
    if (output?.['startupReadyAccepted'] === !![]) {
      payload = !![];
      return;
    }
    ((handle += 0x1),
      void Promise['resolve'](output)
        ['then']((value2) => {
          if (value2?.['startupReadyAccepted'] === !![]) payload = !![];
        })
        ['catch'](() => {})
        ['finally'](() => {
          handle = Math['max'](0x0, handle - 0x1);
        }),
      run(input));
  }
  return setTimeoutFn(() => run2(0x1), current);
}
