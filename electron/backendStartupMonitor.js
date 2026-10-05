function createBackendStartupError(message, code, { cause: cause = null, details: details = null } = {}) {
  const error = new Error(message);
  error['code'] = code;
  if (cause) error['cause'] = cause;
  if (details) error['details'] = details;
  return error;
}
function safeNotify(notify, ...args) {
  try {
    notify?.(...args);
  } catch {}
}
export function createBackendStartupMonitor({
  child: child,
  onError: onError = null,
  onExit: onExit = null,
  onClose: onClose = null,
} = {}) {
  if (!child || typeof child['once'] !== 'function')
    throw new TypeError('Backend child process is required');
  let ready = false,
    failureSettled = false,
    rejectFailure;
  const failure = new Promise((_resolve, reject) => {
      rejectFailure = reject;
    }),
    settleFailure = (error) => {
      if (ready || failureSettled) return false;
      return ((failureSettled = true), rejectFailure(error), true);
    };
  return (
    child['once']('error', (error) => {
      const spawnError = createBackendStartupError(
        'Failed to spawn local backend: ' + (error?.['message'] || error),
        'BACKEND_SPAWN_ERROR',
        { cause: error },
      );
      if (settleFailure(spawnError)) safeNotify(onError, error);
    }),
    child['once']('exit', (exitCode, signal) => {
      (safeNotify(onExit, exitCode, signal),
        settleFailure(
          createBackendStartupError(
            'Local backend exited before readiness (code=' +
              (exitCode ?? '') +
              ', signal=' +
              (signal ?? '') +
              ')',
            'BACKEND_EXITED_BEFORE_READY',
            { details: { exitCode: exitCode, signal: signal } },
          ),
        ));
    }),
    child['once']('close', (closeCode, closeSignal) => {
      safeNotify(onClose, closeCode, closeSignal);
    }),
    {
      failure: failure,
      markReady() {
        ready = true;
      },
    }
  );
}
export function launchMonitoredBackendProcess({
  spawnProcess: spawnProcess,
  command: command,
  args: args = [],
  options: options = {},
  logStream: logStream = null,
  onSpawnError: onSpawnError = null,
  onExit: onExit = null,
} = {}) {
  if (typeof spawnProcess !== 'function')
    throw new TypeError('Backend process launcher is required');
  let logClosed = false,
    spawnFailed = false;
  const closeLog = () => {
      if (logClosed) return;
      ((logClosed = true), logStream?.['end']?.());
    },
    handleSpawnError = (error) => {
      ((spawnFailed = true), safeNotify(onSpawnError, error), closeLog());
    };
  let child;
  try {
    child = spawnProcess(command, args, options);
  } catch (error) {
    handleSpawnError(error);
    throw createBackendStartupError(
      'Failed to spawn local backend: ' + (error?.['message'] || error),
      'BACKEND_SPAWN_ERROR',
      { cause: error },
    );
  }
  logStream &&
    (child['stdout']?.['pipe']?.(logStream, { end: false }),
    child['stderr']?.['pipe']?.(logStream, { end: false }));
  const monitor = createBackendStartupMonitor({
    child: child,
    onError: handleSpawnError,
    onExit: (code, signal) => {
      if (!spawnFailed) safeNotify(onExit, code, signal);
    },
    onClose: closeLog,
  });
  return {
    child: child,
    closeLog: closeLog,
    failure: monitor['failure'],
    markReady: monitor['markReady'],
  };
}
