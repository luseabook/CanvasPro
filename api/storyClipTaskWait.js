// Subscribe before reading the task list: a fast local preflight can finish before enqueue's IPC reply.
// Timeout only stops this wait; it does not cancel the host task or authorize a retry.
export function waitForStoryClipTask(bridge, taskId, { timeout = 600000, initial = null } = {}) {
  if (!taskId || typeof bridge?.onUpdate !== 'function' || typeof bridge?.list !== 'function') {
    return Promise.reject(new Error('镜头初剪任务查询不可用，请核对桌面版本；不要自动重试'));
  }
  return new Promise((resolve, reject) => {
    let settled = false, unsubscribe = null, timer = null;
    const finish = (error, result) => {
      if (settled) return;
      settled = true; if (timer) clearTimeout(timer); unsubscribe?.();
      if (error) reject(error); else resolve(result);
    };
    const accept = task => {
      if (task?.taskId !== taskId) return;
      if (task.status === 'complete') finish(null, task.result || {});
      else if (task.status === 'failed' || task.status === 'cancelled') finish(new Error(task.error || `镜头初剪任务 ${taskId}：${task.status}`));
    };
    unsubscribe = bridge.onUpdate(accept);
    if (settled) { unsubscribe?.(); return; }
    timer = setTimeout(() => finish(new Error(`镜头初剪等待超时，任务 ${taskId} 仍可能运行。请在本地任务中核对，不要盲目重试。`)), timeout);
    accept(initial);
    if (!settled) Promise.resolve().then(() => bridge.list({ limit: 500 })).then(tasks => {
      if (Array.isArray(tasks)) accept(tasks.find(task => task.taskId === taskId));
    }).catch(() => { /* Keep the live subscription until a terminal event or explicit timeout. */ });
  });
}
