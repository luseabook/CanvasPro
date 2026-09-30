/** Run independent teardown steps even if one controller is already broken. */
export function runCleanupSteps(steps, { onError = () => {} } = {}) {
  const errors = [];
  const report = (error, index) => {
    errors.push(error);
    try { onError(error, index); } catch { /* A failed logger must not stop cleanup. */ }
  };
  steps.forEach((step, index) => {
    try {
      const result = step();
      if (result && typeof result.then === 'function') Promise.resolve(result).catch(error => report(error, index));
    } catch (error) { report(error, index); }
  });
  return errors;
}

/** beforeunload is cancelable; pagehide is the first safe teardown point. */
export function registerPageTeardown(windowObject, cleanup, options) {
  const handler = event => {
    if (event.persisted) return; // A BFCache entry must remain usable on restoration.
    windowObject.removeEventListener('pagehide', handler);
    runCleanupSteps([cleanup], options);
  };
  windowObject.addEventListener('pagehide', handler);
  return () => windowObject.removeEventListener('pagehide', handler);
}
