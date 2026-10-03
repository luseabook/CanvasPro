const DEFAULT_CLOSE_RECOVERY_TIMEOUT_MS = 10000;

export async function requestRendererRecoverySnapshot(
  window,
  reason = 'window-close',
  { timeoutMs = DEFAULT_CLOSE_RECOVERY_TIMEOUT_MS } = {},
) {
  if (!window || window.isDestroyed()) return { success: false, reason: 'window-unavailable' };
  const script = `(() => {
    const writer = window.__aiCanvasPrepareForClose || window.__aiCanvasWriteRecoverySnapshotForClose;
    if (typeof writer !== 'function') return { success: false, reason: 'writer-unavailable' };
    return Promise.resolve(writer(${JSON.stringify(reason)}));
  })()`;
  let timer;
  try {
    return await Promise.race([
      window.webContents.executeJavaScript(script, true),
      new Promise(resolve => {
        timer = setTimeout(() => resolve({ success: false, reason: 'timeout' }), timeoutMs);
      }),
    ]);
  } catch (error) {
    return { success: false, reason: 'snapshot-error', error: String(error?.message || error) };
  } finally {
    clearTimeout(timer);
  }
}

export function installRecoverySnapshotBeforeClose(window, options = {}) {
  if (!window) return;
  const {
    getRendererProjectState = () => ({}),
    shouldBypassClose = () => false,
    shouldPrepareRenderer = () => false,
    requestSnapshot = requestRendererRecoverySnapshot,
    confirmCloseWithoutSnapshot,
    onCloseCancelled = () => {},
    logEvent = () => {},
  } = options;
  let approved = false;
  let pending = false;
  window.on('close', event => {
    if (shouldBypassClose()) return;
    if (approved) { approved = false; return; }
    if (getRendererProjectState()?.hasUnsavedChanges !== true && !shouldPrepareRenderer()) return;
    event.preventDefault();
    if (pending) return;
    pending = true;
    void (async () => {
      let result;
      let mayClose = false;
      let discardConfirmed = false;
      try {
        result = await requestSnapshot(window, 'window-close');
        mayClose = result?.success === true || result?.reason === 'clean';
      } catch (error) {
        result = { success: false, reason: 'snapshot-error', error: String(error?.message || error) };
      }
      try {
        if (!mayClose) {
          logEvent({
            type: 'project.recovery_snapshot_before_close_failed', level: 'warn', source: 'main',
            message: 'Persistence before close did not complete',
            context: { reason: result?.reason || 'unknown', error: result?.error || '' },
          });
          // Every failure is fail-closed, not only a protected recovery snapshot.
          mayClose = typeof confirmCloseWithoutSnapshot === 'function' &&
            (await confirmCloseWithoutSnapshot(result)) === true;
          discardConfirmed = mayClose;
        }
      } catch (error) {
        mayClose = false;
        logEvent({ type: 'project.recovery_snapshot_close_confirm_failed', level: 'warn', source: 'main', error });
      } finally {
        pending = false;
        if (mayClose && !window.isDestroyed()) {
          // Only an explicit discard may bypass a renderer beforeunload veto.
          // Normal successful saves still use close(), so newly-dirty work can cancel it.
          if (discardConfirmed && typeof window.destroy === 'function') window.destroy();
          else { approved = true; window.close(); }
        } else {
          onCloseCancelled();
        }
      }
    })();
  });
}
