/** Renderer half of the desktop close handshake; usable with any persisted workspace. */
export function installWorkspaceCloseGuard({ windowObject, getWorkspaces = () => [] }) {
  let pending = null;
  const previous = windowObject.__aiCanvasPrepareForClose;
  const workspaces = () => getWorkspaces().filter(Boolean);
  const dirty = () => {
    try { return workspaces().some(workspace => workspace.hasUnsavedChanges?.() === true); }
    catch { return true; } // A broken dirty-state probe must not silently permit navigation.
  };
  async function flushWorkspaces(reason) {
    for (const workspace of workspaces()) {
      if (typeof workspace.prepareForClose !== 'function') continue;
      const result = await workspace.prepareForClose(reason);
      if (result?.success !== true) return result || { success: false, reason: 'workspace-save-failed' };
    }
    return { success: true };
  }
  function prepare(reason = 'window-close') {
    if (pending) return pending;
    pending = (async () => {
      const result = await flushWorkspaces(reason);
      if (!result.success) return result;
      const writer = windowObject.__aiCanvasWriteRecoverySnapshotForClose;
      if (typeof writer !== 'function') return { success: false, reason: 'canvas-writer-unavailable' };
      const canvas = await writer(reason);
      if (canvas?.success !== true && canvas?.reason !== 'clean') return canvas || { success: false };
      if (dirty()) return { success: false, reason: 'workspace-changed-during-close' };
      return { success: true };
    })().catch(error => ({ success: false, reason: 'workspace-save-failed', error: String(error?.message || error) }))
      .finally(() => { pending = null; });
    return pending;
  }
  function beforeUnload(event) {
    if (!dirty()) return;
    // Refresh / web navigation cannot await a promise. Keep the page by default;
    // never destroy controllers in this cancelable event. The user may explicitly discard.
    event.preventDefault();
    event.returnValue = '';
    void flushWorkspaces('page-navigation').catch(() => {});
  }
  windowObject.__aiCanvasPrepareForClose = prepare;
  windowObject.addEventListener('beforeunload', beforeUnload);
  return {
    prepareForClose: prepare,
    destroy() {
      windowObject.removeEventListener('beforeunload', beforeUnload);
      if (windowObject.__aiCanvasPrepareForClose === prepare) {
        if (previous) windowObject.__aiCanvasPrepareForClose = previous;
        else delete windowObject.__aiCanvasPrepareForClose;
      }
    },
  };
}
