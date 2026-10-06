export function createDesktopStartupLifecycle({
  app: app,
  getSpawnedServer: getSpawnedServer,
  probeServer: probeServer,
  clearPortBeforeStart: clearPortBeforeStart,
  ensureServerRunning: ensureServerRunning,
  setTimer: setTimer = setTimeout,
  clearTimer: clearTimer = clearTimeout,
} = {}) {
  let pendingQuitTimer = null,
    quitting = false,
    relaunchRequested = false;
  function clearPendingQuitTimer() {
    if (pendingQuitTimer !== null) clearTimer(pendingQuitTimer);
    pendingQuitTimer = null;
  }
  function assertStarting() {
    if (!quitting) return;
    throw Object.assign(new Error('Desktop startup cancelled during shutdown'), {
      code: 'AIC_DESKTOP_STARTUP_CANCELLED',
    });
  }
  return {
    requestStart(relaunchArgs) {
      if (quitting) {
        if (!relaunchRequested) {
          if (relaunchArgs) app.relaunch({ args: relaunchArgs });
          else app.relaunch();
          relaunchRequested = true;
        }
        return false;
      }
      return (clearPendingQuitTimer(), true);
    },
    onShellClosed({ isQuittingForUpdate: isQuittingForUpdate, hasUnsavedChanges: hasUnsavedChanges }) {
      clearPendingQuitTimer();
      if (quitting || isQuittingForUpdate) return false;
      if (!hasUnsavedChanges) return true;
      const quitTimer = setTimer(() => {
        if (pendingQuitTimer !== quitTimer) return;
        ((pendingQuitTimer = null), app.quit());
      }, 1200);
      return ((pendingQuitTimer = quitTimer), false);
    },
    beginQuit() {
      ((quitting = true), clearPendingQuitTimer());
    },
    isQuitting: () => quitting,
    assertStarting: assertStarting,
    async prepareBackend() {
      try {
        assertStarting();
        const spawnedServer = getSpawnedServer(),
          isServerAlive = () =>
            spawnedServer &&
            getSpawnedServer() === spawnedServer &&
            spawnedServer.exitCode === null &&
            spawnedServer.signalCode === null &&
            !spawnedServer.killed,
          serverResponded = isServerAlive() && (await probeServer());
        assertStarting();
        if (serverResponded && isServerAlive()) return;
        (await clearPortBeforeStart(), assertStarting(), await ensureServerRunning());
      } finally {
        assertStarting();
      }
    },
  };
}
