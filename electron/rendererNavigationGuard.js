/** Shared save barrier for development reload and backend restart commands. */
export function createRendererNavigationGuard({ getMainWindow, requestSnapshot, shouldPrepare = () => true, onFailure = () => {} }) {
  let pending = false;
  async function report(result) { try { await onFailure(result); } catch {} }
  return {
    async run(reason, action) {
      if (pending) return false;
      pending = true;
      try {
        const window = getMainWindow();
        if (!window || window.isDestroyed()) return false;
        if (shouldPrepare(window)) {
          const result = await requestSnapshot(window, reason);
          if (result?.success !== true && result?.reason !== 'clean') {
            await report(result); return false;
          }
        }
        if (window.isDestroyed()) return false;
        await action(window);
        return true;
      } catch (error) { await report({ success: false, error }); return false; }
      finally { pending = false; }
    },
  };
}
