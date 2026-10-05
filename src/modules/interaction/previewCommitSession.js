function requestFrame(callback) {
  if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(callback);
  return (callback(), 0);
}
function cancelFrame(handle) {
  if (!handle) return;
  typeof cancelAnimationFrame === 'function' && cancelAnimationFrame(handle);
}
export function createPreviewCommitSession({ applyPreview: applyPreview } = {}) {
  let active = false,
    updated = false,
    frameHandle = 0,
    pending = null,
    latest = null;
  const cancelPendingFrame = () => {
      if (!frameHandle) return;
      (cancelFrame(frameHandle), (frameHandle = 0));
    },
    flushPending = () => {
      frameHandle = 0;
      if (pending == null) return;
      const value = pending;
      ((pending = null), (latest = value), applyPreview?.(value));
    },
    scheduleFlush = () => {
      if (frameHandle) return;
      frameHandle = requestFrame(flushPending);
    },
    reset = () => {
      (cancelPendingFrame(), (active = false), (updated = false), (pending = null), (latest = null));
    },
    startSession = (value) => {
      ((active = true), (updated = false), (pending = null), (latest = value));
    };
  return {
    begin: startSession,
    update(value) {
      (!active && startSession(value),
        (updated = true),
        (latest = value),
        (pending = value),
        scheduleFlush());
    },
    getPreview() {
      if (!active) return null;
      return pending || latest;
    },
    commit() {
      cancelPendingFrame();
      pending != null && flushPending();
      const committed = updated && latest != null ? latest : null;
      return (reset(), committed);
    },
    cancel() {
      reset();
    },
    isActive() {
      return active;
    },
  };
}
