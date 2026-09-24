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
export function isChromeShellRuntimeHref(_0x1cd9c1) {
  try {
    const _0x23e51a = new URL(String(_0x1cd9c1 || ''));
    return (
      LOOPBACK_HOSTS['has'](_0x23e51a['hostname']) &&
      _0x23e51a['searchParams']['get']('aicRuntime') === 'chrome-shell'
    );
  } catch {
    return ![];
  }
}
export function isChromeShellStartupAttemptId(_0x38d74a) {
  if (typeof _0x38d74a !== 'string') return ![];
  const _0x11f949 = _0x38d74a;
  return (
    _0x11f949['length'] >= MIN_STARTUP_ATTEMPT_ID_LENGTH &&
    _0x11f949['length'] <= MAX_STARTUP_ATTEMPT_ID_LENGTH &&
    /^[A-Za-z0-9_-]+$/['test'](_0x11f949)
  );
}
function normalizeStartupReadyTimeoutMs(_0x18cde8) {
  const _0x15109c = Number(_0x18cde8);
  if (
    !Number['isInteger'](_0x15109c) ||
    _0x15109c < MIN_STARTUP_READY_TIMEOUT_MS ||
    _0x15109c > MAX_STARTUP_READY_TIMEOUT_MS
  )
    return null;
  return _0x15109c;
}
function readNavigationElapsedMs(_0x47db1d) {
  try {
    const _0x142a3b = Number(_0x47db1d?.['performance']?.['now']?.());
    return Number['isFinite'](_0x142a3b) && _0x142a3b >= 0x0 ? _0x142a3b : null;
  } catch {
    return null;
  }
}
export function buildChromeShellStartupMetadataUrl(
  _0x37daf3,
  { startupAttemptId: _0x39d257, readyTimeoutMs: _0x210bc8 } = {},
) {
  if (!isChromeShellStartupAttemptId(_0x39d257))
    throw new TypeError('Invalid Chrome shell startup attempt id');
  const _0x34119d = normalizeStartupReadyTimeoutMs(_0x210bc8);
  if (_0x34119d == null) throw new RangeError('Invalid Chrome shell startup ready timeout');
  const _0x4d4df9 = new URL(String(_0x37daf3 || ''));
  return (
    _0x4d4df9['searchParams']['set'](CHROME_SHELL_STARTUP_ATTEMPT_ID_PARAM, _0x39d257),
    _0x4d4df9['searchParams']['set'](CHROME_SHELL_STARTUP_READY_TIMEOUT_MS_PARAM, String(_0x34119d)),
    _0x4d4df9['href']
  );
}
export function readChromeShellStartupMetadata(_0x400dde) {
  if (!isChromeShellRuntimeHref(_0x400dde)) return null;
  try {
    const _0xe2c306 = new URL(String(_0x400dde || '')),
      _0x248501 = String(_0xe2c306['searchParams']['get'](CHROME_SHELL_STARTUP_ATTEMPT_ID_PARAM) || ''),
      _0x1aeb0c = String(_0xe2c306['searchParams']['get'](CHROME_SHELL_STARTUP_READY_TIMEOUT_MS_PARAM) || ''),
      _0x3c571a = /^(?:[1-9]\d*)$/['test'](_0x1aeb0c) ? normalizeStartupReadyTimeoutMs(_0x1aeb0c) : null;
    if (!isChromeShellStartupAttemptId(_0x248501) || _0x3c571a == null) return null;
    return { startupAttemptId: _0x248501, readyTimeoutMs: _0x3c571a };
  } catch {
    return null;
  }
}
export function scheduleChromeShellStartupReady({
  windowObject: windowObject = globalThis['window'],
  diagnostics: _0x5de5bd,
  delayMs: delayMs = DEFAULT_CHROME_SHELL_STARTUP_READY_DELAY_MS,
  retryDelayMs: retryDelayMs = 0x2ee,
  maxAttempts: _0x15e55d,
  setTimeoutFn: setTimeoutFn = setTimeout,
} = {}) {
  const _0x39bad3 = String(windowObject?.['location']?.['href'] || ''),
    _0x298a1d = readChromeShellStartupMetadata(_0x39bad3);
  if (!_0x298a1d) return null;
  if (typeof _0x5de5bd?.['logEvent'] !== 'function') return null;
  const _0x3f8850 = Math['max'](0x64, Math['min'](0x1388, Number(retryDelayMs) || 0x0)),
    _0x14ac7a = Math['max'](0x0, Math['min'](0x2710, Number(delayMs) || 0x0)),
    _0x4d06f6 = Math['min'](
      _0x298a1d['readyTimeoutMs'] - 0x1,
      Math['max'](0x0, readNavigationElapsedMs(windowObject) || 0x0),
    ),
    _0x5402d4 = Math['max'](0x1, _0x298a1d['readyTimeoutMs'] - _0x4d06f6),
    _0x1c983d = Math['min'](_0x14ac7a, Math['max'](0x0, _0x5402d4 - _0x3f8850)),
    _0x156c86 = Math['max'](0x1, Math['ceil']((_0x5402d4 - _0x1c983d) / _0x3f8850)),
    _0x61c14 =
      _0x15e55d == null
        ? _0x156c86
        : Math['min'](_0x156c86, Math['max'](0x1, Math['round'](Number(_0x15e55d) || 0x0)));
  let _0x444c78 = ![],
    _0xf9b275 = 0x0,
    _0x4d2c4a = 0x0,
    _0x17021f = ![];
  windowObject?.['addEventListener']?.(
    'pagehide',
    () => {
      _0x17021f = !![];
    },
    { once: !![] },
  );
  function _0x44b0f2(_0x4ca42d) {
    if (_0x4ca42d >= _0x156c86 || _0x4d2c4a >= _0x61c14) return;
    void Promise['resolve']()['then'](() => {
      if (_0x444c78 || _0x17021f || _0x4d2c4a >= _0x61c14) return;
      setTimeoutFn(() => _0x4161ea(_0x4ca42d + 0x1), _0x3f8850);
    });
  }
  function _0x4161ea(_0x1de197) {
    if (_0x444c78 || _0x17021f || _0x1de197 > _0x156c86) return;
    const _0x29d0b4 = readNavigationElapsedMs(windowObject);
    if (_0x29d0b4 != null && _0x29d0b4 >= _0x298a1d['readyTimeoutMs']) return;
    if (_0xf9b275 >= MAX_PENDING_READY_REPORTS || _0x4d2c4a >= _0x61c14) {
      _0x44b0f2(_0x1de197);
      return;
    }
    const _0x41b1fb = _0x4d2c4a + 0x1;
    _0x4d2c4a = _0x41b1fb;
    let _0x2a026b;
    try {
      _0x2a026b = _0x5de5bd['logEvent']({
        type: CHROME_SHELL_STARTUP_READY_EVENT,
        level: 'info',
        source: 'renderer',
        message: 'Chrome shell renderer completed startup',
        context: {
          attempt: _0x41b1fb,
          href: _0x39bad3,
          navigationElapsedMs: _0x4d06f6,
          readyTimeoutMs: _0x298a1d['readyTimeoutMs'],
          remainingTimeoutMs: _0x5402d4,
          startupAttemptId: _0x298a1d['startupAttemptId'],
          userAgent: String(windowObject?.['navigator']?.['userAgent'] || ''),
        },
      });
    } catch {
      _0x2a026b = null;
    }
    if (_0x2a026b?.['startupReadyAccepted'] === !![]) {
      _0x444c78 = !![];
      return;
    }
    ((_0xf9b275 += 0x1),
      void Promise['resolve'](_0x2a026b)
        ['then']((_0x21f3c7) => {
          if (_0x21f3c7?.['startupReadyAccepted'] === !![]) _0x444c78 = !![];
        })
        ['catch'](() => {})
        ['finally'](() => {
          _0xf9b275 = Math['max'](0x0, _0xf9b275 - 0x1);
        }),
      _0x44b0f2(_0x1de197));
  }
  return setTimeoutFn(() => _0x4161ea(0x1), _0x1c983d);
}
