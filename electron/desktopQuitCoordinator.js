import { runCleanupSteps } from '../src/utils/cleanupSteps.js';
/** Keep cancelable window-close / persistence ahead of any resource teardown. */
export function createDesktopQuitCoordinator({
  app,
  getMainWindow,
  platform = process.platform,
  shouldBypassClose = () => false,
  beginShutdown = () => {},
  cleanup = () => {},
  onError = () => {},
}) {
  let committed = false;
  let requested = false;
  let waiting = false;
  let relaunchRequested = false;
  function commit() {
    if (committed) return;
    committed = true;
    runCleanupSteps([
      beginShutdown,
      cleanup,
      () => { if (relaunchRequested) app.relaunch(); },
    ], { onError });
  }
  return {
    beforeQuit(event) {
      if (committed) return;
      const window = getMainWindow();
      if (!shouldBypassClose() && window && !window.isDestroyed()) {
        event.preventDefault();
        requested = true;
        if (!waiting) { waiting = true; window.close(); }
        return;
      }
      commit();
    },
    mainWindowClosed() {
      waiting = false;
      if (!committed && (requested || platform !== 'darwin')) {
        commit();
        app.quit();
      }
    },
    requestRelaunch() {
      if (committed) return;
      relaunchRequested = true;
      app.quit(); // Reuse the normal asynchronous save / cancel handshake.
    },
    cancelQuit() { requested = false; waiting = false; relaunchRequested = false; },
    willQuit: commit,
    isQuitting: () => committed,
  };
}
