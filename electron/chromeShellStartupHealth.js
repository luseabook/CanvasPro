import {
  CHROME_SHELL_STARTUP_READY_EVENT,
  CHROME_SHELL_STARTUP_FAILED_EVENT,
  isChromeShellStartupAttemptId,
  readChromeShellStartupMetadata,
} from '../src/services/chromeShellStartupReadiness.js';
const DEFAULT_READY_TIMEOUT_MS = 0x7530,
  MIN_READY_TIMEOUT_MS = 0x3e8,
  MAX_READY_TIMEOUT_MS = 0x1d4c0;
function createStartupHealthError(message, code) {
  const error = new Error(message);
  return ((error['code'] = code), error);
}
export function resolveChromeShellStartupReadyTimeoutMs(env = process['env']) {
  const raw = Number(env?.['AIC_CHROME_SHELL_READY_TIMEOUT_MS']);
  if (!Number['isFinite'](raw) || raw <= 0x0) return DEFAULT_READY_TIMEOUT_MS;
  return Math['max'](MIN_READY_TIMEOUT_MS, Math['min'](MAX_READY_TIMEOUT_MS, Math['round'](raw)));
}
export function createChromeShellStartupHealthController({
  setTimeoutFn: setTimeoutFn = setTimeout,
  clearTimeoutFn: clearTimeoutFn = clearTimeout,
  now: now = () => Date['now'](),
} = {}) {
  let lastResolved = null,
    pending = null;
  function cancelPending(error) {
    if (!pending) return false;
    const entry = pending;
    return ((pending = null), clearTimeoutFn(entry['timer']), entry['reject'](error), true);
  }
  function waitForReady({
    timeoutMs: timeoutMs = DEFAULT_READY_TIMEOUT_MS,
    startupAttemptId: startupAttemptId,
  } = {}) {
    if (!isChromeShellStartupAttemptId(startupAttemptId))
      return Promise['reject'](
        createStartupHealthError(
          'Chrome shell startup attempt ID is invalid',
          'CHROME_SHELL_STARTUP_ATTEMPT_INVALID',
        ),
      );
    ((lastResolved = null),
      cancelPending(
        createStartupHealthError(
          'Chrome shell renderer readiness wait was replaced',
          'CHROME_SHELL_RENDERER_READY_REPLACED',
        ),
      ));
    const startedAt = now(),
      effectiveTimeoutMs = Math['max'](
        MIN_READY_TIMEOUT_MS,
        Math['min'](MAX_READY_TIMEOUT_MS, Math['round'](Number(timeoutMs) || 0x0)),
      );
    return new Promise((resolve, reject) => {
      const timer = setTimeoutFn(() => {
        if (!pending || pending['reject'] !== reject) return;
        ((pending = null),
          reject(
            createStartupHealthError(
              'Chrome shell renderer did not become ready within ' + effectiveTimeoutMs + 'ms',
              'CHROME_SHELL_RENDERER_READY_TIMEOUT',
            ),
          ));
      }, effectiveTimeoutMs);
      pending = {
        reject: reject,
        resolve: resolve,
        readyTimeoutMs: effectiveTimeoutMs,
        startedAt: startedAt,
        startupAttemptId: startupAttemptId,
        timer: timer,
      };
    });
  }
  function observeDiagnosticEvent(event = {}) {
    const isFailure = event?.['type'] === CHROME_SHELL_STARTUP_FAILED_EVENT;
    if (!isFailure && event?.['type'] !== CHROME_SHELL_STARTUP_READY_EVENT) return false;
    if (event?.['source'] !== 'renderer') return false;
    const metadata = readChromeShellStartupMetadata(event?.['context']?.['href']);
    if (!metadata) return false;
    if (event?.['context']?.['startupAttemptId'] !== metadata['startupAttemptId']) return false;
    if (event?.['context']?.['readyTimeoutMs'] !== metadata['readyTimeoutMs']) return false;
    if (!pending) {
      if (isFailure) return false;
      return (
        lastResolved?.['startupAttemptId'] === metadata['startupAttemptId'] &&
        lastResolved?.['readyTimeoutMs'] === metadata['readyTimeoutMs']
      );
    }
    if (metadata['startupAttemptId'] !== pending['startupAttemptId']) return false;
    if (metadata['readyTimeoutMs'] !== pending['readyTimeoutMs']) return false;
    if (isFailure) {
      const failureError = createStartupHealthError(
          'Canvas\x20renderer\x20initialization\x20failed',
          'CHROME_SHELL_RENDERER_STARTUP_FAILED',
        ),
        knownStages = ['entry', 'initialization', 'storage-migration', 'project-hydration'];
      return (
        (failureError['details'] = {
          stage: knownStages['includes'](event['context']['failure'])
            ? event['context']['failure']
            : 'initialization',
        }),
        cancelPending(failureError)
      );
    }
    const entry = pending;
    return (
      (pending = null),
      (lastResolved = {
        readyTimeoutMs: entry['readyTimeoutMs'],
        startupAttemptId: entry['startupAttemptId'],
      }),
      clearTimeoutFn(entry['timer']),
      entry['resolve']({
        ready: true,
        elapsedMs: Math['max'](0x0, now() - entry['startedAt']),
        href: String(event?.['context']?.['href'] || ''),
        startupAttemptId: entry['startupAttemptId'],
      }),
      true
    );
  }
  function cancel(
    message = 'Chrome shell renderer readiness wait was cancelled',
    { startupAttemptId: startupAttemptId } = {},
  ) {
    if (startupAttemptId !== undefined && pending?.['startupAttemptId'] !== startupAttemptId) return false;
    return cancelPending(createStartupHealthError(message, 'CHROME_SHELL_RENDERER_READY_CANCELLED'));
  }
  return { cancel: cancel, observeDiagnosticEvent: observeDiagnosticEvent, waitForReady: waitForReady };
}
export const __chromeShellStartupHealthForTest = {
  DEFAULT_READY_TIMEOUT_MS: DEFAULT_READY_TIMEOUT_MS,
  MAX_READY_TIMEOUT_MS: MAX_READY_TIMEOUT_MS,
  MIN_READY_TIMEOUT_MS: MIN_READY_TIMEOUT_MS,
};
