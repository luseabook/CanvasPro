export const CHROME_SHELL_STARTUP_READY_EVENT = 'renderer.chrome_shell_startup_ready';
export const CHROME_SHELL_STARTUP_FAILED_EVENT = 'renderer.chrome_shell_startup_failed';
export const DEFAULT_CHROME_SHELL_STARTUP_READY_DELAY_MS = 1500;
export const CHROME_SHELL_STARTUP_ATTEMPT_ID_PARAM = 'aicStartupAttemptId';
export const CHROME_SHELL_STARTUP_READY_TIMEOUT_MS_PARAM = 'aicStartupReadyTimeoutMs';
const MIN_STARTUP_ATTEMPT_ID_LENGTH = 16,
  MAX_STARTUP_ATTEMPT_ID_LENGTH = 128,
  MIN_STARTUP_READY_TIMEOUT_MS = 1000,
  MAX_STARTUP_READY_TIMEOUT_MS = 120000,
  MAX_PENDING_READY_REPORTS = 2,
  LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);
export function isChromeShellRuntimeHref(value) {
  try {
    const uRL = new URL(String(value || ''));
    return (
      LOOPBACK_HOSTS['has'](uRL['hostname']) && uRL['searchParams']['get']('aicRuntime') === 'chrome-shell'
    );
  } catch {
    return false;
  }
}
export function isChromeShellStartupAttemptId(item) {
  if (typeof item !== 'string') return false;
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
    return Number['isFinite'](count) && count >= 0 ? count : null;
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
  retryDelayMs: retryDelayMs = 750,
  maxAttempts: maxAttempts,
  setTimeoutFn: setTimeoutFn = setTimeout,
} = {}) {
  const href = String(windowObject?.['location']?.['href'] || ''),
    readyTimeoutMs3 = readChromeShellStartupMetadata(href);
  if (!readyTimeoutMs3) return null;
  if (typeof diagnostics?.['logEvent'] !== 'function') return null;
  const source = Math['max'](100, Math['min'](5000, Number(retryDelayMs) || 0)),
    next = Math['max'](0, Math['min'](10000, Number(delayMs) || 0)),
    navigationElapsedMs = Math['min'](
      readyTimeoutMs3['readyTimeoutMs'] - 1,
      Math['max'](0, readNavigationElapsedMs(windowObject) || 0),
    ),
    remainingTimeoutMs = Math['max'](1, readyTimeoutMs3['readyTimeoutMs'] - navigationElapsedMs),
    current = Math['min'](next, Math['max'](0, remainingTimeoutMs - source)),
    entry = Math['max'](1, Math['ceil']((remainingTimeoutMs - current) / source)),
    record =
      maxAttempts == null
        ? entry
        : Math['min'](entry, Math['max'](1, Math['round'](Number(maxAttempts) || 0)));
  let payload = false,
    handle = 0,
    state = 0,
    config = false;
  windowObject?.['addEventListener']?.(
    'pagehide',
    () => {
      config = true;
    },
    { once: true },
  );
  function run(scope) {
    if (scope >= entry || state >= record) return;
    void Promise['resolve']()['then'](() => {
      if (payload || config || state >= record) return;
      setTimeoutFn(() => run2(scope + 1), source);
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
    const attempt = state + 1;
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
    if (output?.['startupReadyAccepted'] === true) {
      payload = true;
      return;
    }
    ((handle += 1),
      void Promise['resolve'](output)
        ['then']((value2) => {
          if (value2?.['startupReadyAccepted'] === true) payload = true;
        })
        ['catch'](() => {})
        ['finally'](() => {
          handle = Math['max'](0, handle - 1);
        }),
      run(input));
  }
  return setTimeoutFn(() => run2(1), current);
}
