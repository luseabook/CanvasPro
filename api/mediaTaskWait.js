// Read-only reconciliation for a task that can finish before enqueue's IPC reply.
// A timeout ends this listener only: it never stops, retries, or resubmits the host job.
const TERMINAL = new Set(['complete', 'failed', 'cancelled']);

export function waitForExactMediaTask(bridge, taskId, { timeout = 0, onFailure = () => {} } = {}) {
  const id = String(taskId || '').trim();
  if (!id || typeof bridge?.onUpdate !== 'function') {
    return Promise.reject(new Error('Electron media task update API unavailable'));
  }
  return new Promise((resolve, reject) => {
    let settled = false;
    let unsubscribe = null;
    let timer = null;

    function finish(task, error = null, errorStatus = '') {
      if (settled) return;
      settled = true;
      if (timer !== null) clearTimeout(timer);
      try { unsubscribe?.(); } catch { /* Listener cleanup cannot change the task outcome. */ }
      if (!error) { resolve(task?.result || {}); return; }
      try { onFailure({ taskId: id, status: errorStatus || task?.status || 'failed', error }); }
      catch { /* Diagnostics cannot trigger another task or hide the original error. */ }
      reject(error);
    }

    function accept(task) {
      if (task?.taskId !== id || !TERMINAL.has(task?.status)) return;
      if (task.status === 'complete') { finish(task); return; }
      if (task.status === 'cancelled') { finish(task, new Error('Media task cancelled')); return; }
      finish(task, new Error(task.error || 'Media task failed'));
    }

    try { unsubscribe = bridge.onUpdate(accept); }
    catch (error) { finish(null, error, 'subscribe_failed'); return; }
    // Some bridge implementations may deliver synchronously inside onUpdate.
    if (settled) { try { unsubscribe?.(); } catch {} return; }
    if (timeout > 0) {
      timer = setTimeout(() => finish(null, new Error(
        'Media task wait timed out; the task may still be running. Check the task center; do not blindly retry.'
      ), 'timeout'), timeout);
    }
    if (typeof bridge.list !== 'function') return; // Older host: live events only.
    // Subscribe first, then read the host's exact task ID; never enqueue/cancel here.
    Promise.resolve().then(() => settled ? null : bridge.list({ taskId: id })).then(rows => {
      if (settled || rows === null || !Array.isArray(rows)) return;
      const matches = rows.filter(task => task?.taskId === id);
      if (matches.length > 1) {
        finish(null, new Error('Ambiguous media task ID; check the task center before retrying'), 'ambiguous');
        return;
      }
      if (matches.length === 1) accept(matches[0]);
    }).catch(() => { /* A failed read is not a failed task; keep listening. */ });
  });
}
