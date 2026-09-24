// One in-flight batch per page. It is not a provider-side or cross-window billing lock.
let activeRunner = null;
export function createStoryMediaBatchRunner({ items, prepare, assertCurrent, onChange = () => {} }) {
  if (!Array.isArray(items) || !items.length || items.length > 6 || new Set(items.map(item => item.nodeId)).size !== items.length) {
    throw new Error('每批请选择1–6个不重复的镜头节点');
  }
  const jobs = items.map(item => ({ nodeId: item.nodeId, state: 'held', message: '尚未发送' }));
  let lease = null, preparing = false, running = false, stopped = false, disposed = false, phase = 'held';
  const owner = {};
  function snapshot() { return { phase, preparing, running, prepared: Boolean(lease), jobs: jobs.map(job => ({ ...job })) }; }
  function emit() { try { onChange(snapshot()); } catch { /* Rendering must never control paid dispatch. */ } }
  function release() { lease?.release(); lease = null; }
  function check() {
    if (disposed || stopped) throw new Error('已停止后续发送');
    assertCurrent();
  }
  return {
    snapshot,
    async prepare() {
      if (disposed || preparing || running || lease) return false;
      preparing = true; stopped = false; phase = 'preparing'; emit();
      try {
        check();
        const acquired = await prepare(() => !disposed && !stopped);
        lease = acquired;
        check(); phase = 'ready'; return true;
      } catch (error) {
        release(); phase = 'blocked';
        for (const job of jobs) if (job.state === 'held') job.message = error.message || '准备失败，尚未调用生成入口';
        return false;
      } finally { preparing = false; emit(); }
    },
    async start() {
      if (disposed || preparing || running || !lease) return false;
      if (activeRunner) throw new Error('另一个镜头媒体批次仍在等待，请先核对在途任务');
      const pending = jobs.filter(job => job.state === 'held');
      if (!pending.length) return false;
      activeRunner = owner; running = true; stopped = false; phase = 'running'; emit();
      try {
        check(); lease.assertNoLocalRunning();
        // Whole-batch preflight before the first paid invocation, then recheck each item.
        for (const job of pending) lease.verify(job.nodeId);
        for (const job of pending) {
          if (disposed || stopped) break;
          try {
            check(); lease.verify(job.nodeId);
            lease.markAttempt(job.nodeId); // A failure here must not invoke the native runtime.
            check();
            job.state = 'running'; job.message = '已调用原生成入口，等待原节点结果；可能计费'; emit();
            // No request payload, retry option, resume or cancellation is constructed here.
            await lease.invoke(job.nodeId);
            assertCurrent();
            const result = lease.inspect(job.nodeId);
            job.state = result.state; job.message = result.message;
            if (job.state !== 'succeeded') { stopped = true; phase = 'paused'; }
          } catch {
            job.state = job.state === 'running' ? 'unknown' : 'blocked';
            job.message = job.state === 'unknown' ? '执行结果待核对；请检查原节点/厂商记录，不会自动重发' : '发送前检查或尝试标记失败；请核对原节点，不会自动重发';
            stopped = true; phase = 'paused';
          }
          emit();
          if (stopped) break;
        }
        if (!stopped && !disposed) phase = 'finished';
      } catch (error) {
        stopped = true; phase = 'paused';
        for (const job of pending) if (job.state === 'held') job.message = error.message || '批次检查失败，尚未发送';
      } finally {
        running = false;
        if (activeRunner === owner) activeRunner = null;
        if (disposed) release();
        emit();
      }
      return true;
    },
    pause() { stopped = true; phase = 'paused'; emit(); },
    dispose() {
      disposed = true; stopped = true; phase = 'closed';
      // Keep the runtime pinned until its actual Promise settles. Closing isn't cancellation.
      if (!running && !preparing) release();
      emit();
    },
  };
}
