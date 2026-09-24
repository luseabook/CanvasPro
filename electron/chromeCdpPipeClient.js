const DEFAULT_COMMAND_TIMEOUT_MS = 0x3a98;
function createProtocolError(error = {}) {
  const message = String(error?.['message'] || 'Chrome DevTools Protocol command failed'),
    protocolError = new Error(message);
  if (error?.['code'] != null) protocolError['code'] = error['code'];
  if (error?.['data'] != null) protocolError['data'] = error['data'];
  return protocolError;
}
export function createChromeCdpPipeClient({
  readable: readablePipe,
  writable: writablePipe,
  commandTimeoutMs: commandTimeoutMs = DEFAULT_COMMAND_TIMEOUT_MS,
  setTimeoutFn: setTimeoutFn = setTimeout,
  clearTimeoutFn: clearTimeoutFn = clearTimeout,
  logEvent: logEvent = null,
} = {}) {
  if (!readablePipe || typeof readablePipe['on'] !== 'function')
    throw new TypeError('Chrome CDP readable pipe is required');
  if (!writablePipe || typeof writablePipe['write'] !== 'function')
    throw new TypeError('Chrome\x20CDP\x20writable\x20pipe\x20is\x20required');
  const pending = new Map(),
    eventHandlers = new Set();
  let nextId = 0x0,
    buffer = '',
    isClosed = false;
  function settle(id, callback) {
    const entry = pending['get'](id);
    if (!entry) return false;
    pending['delete'](id);
    if (entry['timer']) clearTimeoutFn(entry['timer']);
    return (callback(entry), true);
  }
  function dispatch(message = {}) {
    if (message['id'] != null) {
      settle(message['id'], (entry) => {
        if (message['error']) {
          entry['reject'](createProtocolError(message['error']));
          return;
        }
        entry['resolve'](message['result'] || {});
      });
      return;
    }
    if (!message['method']) return;
    for (const handler of [...eventHandlers]) {
      try {
        handler(message);
      } catch {}
    }
  }
  function onData(chunk) {
    buffer += Buffer['isBuffer'](chunk) ? chunk['toString']('utf8') : String(chunk || '');
    while (true) {
      const separatorIndex = buffer['indexOf']('\x00');
      if (separatorIndex < 0x0) break;
      const frame = buffer['slice'](0x0, separatorIndex);
      buffer = buffer['slice'](separatorIndex + 0x1);
      if (!frame) continue;
      try {
        dispatch(JSON['parse'](frame));
      } catch (parseError) {
        logEvent?.({
          type: 'chrome_cdp.invalid_message',
          level: 'warn',
          source: 'main',
          message: 'Chrome\x20CDP\x20pipe\x20returned\x20an\x20invalid\x20message',
          error: parseError,
        });
      }
    }
  }
  function close(reason = 'Chrome CDP pipe closed') {
    if (isClosed) return;
    ((isClosed = true),
      readablePipe['off']?.('data', onData),
      readablePipe['off']?.('close', onPipeClosed),
      readablePipe['off']?.('end', onPipeClosed),
      readablePipe['off']?.('error', onPipeError),
      writablePipe['off']?.('close', onPipeClosed),
      writablePipe['off']?.('error', onPipeError));
    for (const pendingId of [...pending['keys']()]) {
      settle(pendingId, (entry) => entry['reject'](new Error(reason)));
    }
    eventHandlers['clear']();
  }
  function onPipeClosed() {
    close();
  }
  function onPipeError(error) {
    (logEvent?.({
      type: 'chrome_cdp.pipe_error',
      level: 'warn',
      source: 'main',
      message: 'Chrome CDP pipe failed',
      error: error,
    }),
      close(String(error?.['message'] || error || 'Chrome CDP pipe failed')));
  }
  (readablePipe['on']('data', onData),
    readablePipe['on']('close', onPipeClosed),
    readablePipe['on']('end', onPipeClosed),
    readablePipe['on']('error', onPipeError),
    writablePipe['on']?.('close', onPipeClosed),
    writablePipe['on']?.('error', onPipeError));
  function send(method, params = {}, sessionId = '') {
    if (isClosed) return Promise['reject'](new Error('Chrome CDP pipe is closed'));
    const requestId = ++nextId,
      payload = {
        id: requestId,
        method: String(method || ''),
        params: params && typeof params === 'object' ? params : {},
        ...(sessionId ? { sessionId: String(sessionId) } : {}),
      };
    if (!payload['method']) return Promise['reject'](new Error('Chrome CDP method is required'));
    return new Promise((resolve, reject) => {
      const delay = Math['max'](0x0, Number(commandTimeoutMs) || 0x0),
        timer =
          delay > 0x0
            ? setTimeoutFn(() => {
                settle(requestId, (entry) => {
                  entry['reject'](new Error('Chrome CDP command timed out: ' + payload['method']));
                });
              }, delay)
            : null;
      pending['set'](requestId, {
        resolve: resolve,
        reject: reject,
        timer: timer,
        method: payload['method'],
      });
      try {
        writablePipe['write'](JSON['stringify'](payload) + '\x00', 'utf8');
      } catch (writeError) {
        settle(requestId, (entry) => entry['reject'](writeError));
      }
    });
  }
  return {
    send: send,
    onEvent(handler) {
      if (typeof handler !== 'function' || isClosed) return () => {};
      return (eventHandlers['add'](handler), () => eventHandlers['delete'](handler));
    },
    close: close,
    get closed() {
      return isClosed;
    },
  };
}
export const __chromeCdpPipeClientForTest = { createProtocolError: createProtocolError };
