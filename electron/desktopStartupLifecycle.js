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
    quitting = ![],
    relaunchRequested = ![];
  function clearPendingQuitTimer() {
    if (pendingQuitTimer !== null) clearTimer(pendingQuitTimer);
    pendingQuitTimer = null;
  }
  function assertStarting() {
    if (!quitting) return;
    throw Object['assign'](new Error('Desktop\x20startup\x20cancelled\x20during\x20shutdown'), {
      code: 'AIC_DESKTOP_STARTUP_CANCELLED',
    });
  }
  return {
    requestStart(relaunchArgs) {
      if (quitting) {
        if (!relaunchRequested) {
          if (relaunchArgs) app['relaunch']({ args: relaunchArgs });
          else app['relaunch']();
          relaunchRequested = !![];
        }
        return ![];
      }
      return (clearPendingQuitTimer(), !![]);
    },
    onShellClosed({ isQuittingForUpdate: isQuittingForUpdate, hasUnsavedChanges: hasUnsavedChanges }) {
      clearPendingQuitTimer();
      if (quitting || isQuittingForUpdate) return ![];
      if (!hasUnsavedChanges) return !![];
      const quitTimer = setTimer(() => {
        if (pendingQuitTimer !== quitTimer) return;
        ((pendingQuitTimer = null), app['quit']());
      }, 0x4b0);
      return ((pendingQuitTimer = quitTimer), ![]);
    },
    beginQuit() {
      ((quitting = !![]), clearPendingQuitTimer());
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
            spawnedServer['exitCode'] === null &&
            spawnedServer['signalCode'] === null &&
            !spawnedServer['killed'],
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
