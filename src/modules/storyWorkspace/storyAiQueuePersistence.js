import { createStoryQueueDatabase } from './storyAiQueueStorage.js';

export function createStoryQueuePersistence({ queue, scope, isCurrent, database = createStoryQueueDatabase(), delay = 300 }) {
  let enabled = false, working = false, closed = false, saving = 0, dirty = false, error = '', revision = null, lastRaw = null, record = null, release = null;
  let timer = null, tail = Promise.resolve(), probeEpoch = 0;
  const listeners = new Set();
  function emit() { for (const listener of listeners) { try { listener(); } catch {} } }
  function stopTimer() { clearTimeout(timer); timer = null; }
  function requireScope() { if (!scope) throw new Error('缺少稳定工程/画布标识，请先保存工程或使用手动快照'); }
  function requireIdle() { if (closed || working || queue.isBusy()) throw new Error('请先暂停并等待当前请求/保存操作结束'); }
  function fail(cause) {
    error = String(cause?.message || '本地保存失败，请手动导出').slice(0, 600); dirty = true; stopTimer(); queue.pause(); emit();
  }
  function flush() {
    if (!enabled) return Promise.resolve();
    stopTimer();
    let raw;
    try { if (error) throw new Error(error); raw = queue.snapshot(); }
    catch (cause) { fail(cause); return Promise.reject(cause); }
    saving++; emit();
    const action = tail.then(async () => {
      if (error) throw new Error(error);
      if (raw !== lastRaw) {
        record = await database.write(scope.key, raw, revision);
        revision = record.revision; lastRaw = raw;
      }
      dirty = queue.snapshot() !== lastRaw;
    });
    tail = action.catch(fail).finally(() => { saving--; emit(); });
    return action;
  }
  async function checkpoint() {
    if (!enabled) return;
    do { await flush(); } while (enabled && queue.snapshot() !== lastRaw);
  }
  const unsubscribe = queue.subscribe(() => {
    if (!enabled || closed) return;
    dirty = true; emit(); stopTimer();
    if (!error) timer = setTimeout(() => { void flush().catch(() => {}); }, delay);
  });
  async function operation(action) {
    requireIdle(); requireScope(); probeEpoch++; working = true; emit();
    try { return await action(); }
    catch (cause) { error = String(cause.message).slice(0, 600); emit(); throw cause; }
    finally { working = false; emit(); }
  }
  async function acquire() { if (!release) release = await database.lock(scope.key); }
  function unlock() { release?.(); release = null; }
  return {
    getInfo() { return { available: Boolean(scope), enabled, working, saving: saving > 0, dirty, error, hasRecord: Boolean(record), savedAt: record?.updatedAt || 0 }; },
    isWorking() { return working; },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    async probe() {
      if (!scope || enabled || working || closed) return;
      const epoch = ++probeEpoch;
      try {
        const saved = await database.read(scope.key);
        if (!closed && !enabled && !working && epoch === probeEpoch) { record = saved; error = ''; emit(); }
      } catch (cause) { if (!closed && !enabled && !working && epoch === probeEpoch) { error = String(cause.message).slice(0, 600); emit(); } }
    },
    enable() {
      return operation(async () => {
        if (!isCurrent()) throw new Error('来源工程/画布已改变，请重开工作室');
        if (enabled) throw new Error('自动保存已经启用');
        try {
          await acquire(); record = await database.read(scope.key);
          if (closed || !isCurrent()) throw new Error('来源已改变，未启用');
          if (record) throw new Error('本地已有快照，请先恢复、导出或删除；不会覆盖它');
          revision = null; lastRaw = null; error = ''; enabled = true; dirty = true; await checkpoint();
        } finally { if (!enabled) unlock(); }
      });
    },
    recover() {
      return operation(async () => {
        if (enabled) throw new Error('请先关闭自动保存并导出内存结果');
        if (!isCurrent()) throw new Error('来源上下文已改变');
        try {
          await acquire(); const saved = await database.read(scope.key);
          if (closed || !isCurrent()) throw new Error('来源已改变，未恢复');
          if (!saved) throw new Error('当前工作室没有本地记录');
          queue.restore(saved.raw); record = saved; revision = saved.revision; lastRaw = saved.raw;
          enabled = true; error = ''; dirty = true; await checkpoint();
        } finally { if (!enabled) unlock(); }
      });
    },
    retry() { return operation(async () => { if (!enabled) throw new Error('自动保存未启用'); error = ''; await checkpoint(); }); },
    disable() {
      return operation(async () => {
        try { if (enabled && !error) await checkpoint(); } finally { enabled = false; stopTimer(); await tail; unlock(); }
      });
    },
    remove() {
      return operation(async () => {
        enabled = false; stopTimer(); await tail;
        try { await acquire(); const saved = await database.read(scope.key); await database.remove(scope.key, saved?.revision ?? null); record = null; revision = null; lastRaw = null; error = ''; dirty = queue.hasJobs(); }
        finally { unlock(); }
      });
    },
    async exportSaved() { requireScope(); const saved = await database.read(scope.key); if (!saved) throw new Error('没有已提交的本地记录'); return saved.raw; },
    checkpoint,
    async finish() {
      closed = true; probeEpoch++; stopTimer(); unsubscribe();
      try { await queue.waitUntilIdle(); await checkpoint(); await tail; }
      finally { enabled = false; unlock(); listeners.clear(); }
    },
  };
}
