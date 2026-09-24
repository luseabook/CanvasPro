import { parseStoryAiShotsProposal } from './storyAiShotsModel.js';
import { STORY_AI_LIMITS } from './storyAiModel.js';
import { parseStoryAiQueueSnapshot, serializeStoryAiQueue, storyAiQueueTask, STORY_AI_QUEUE_LIMITS } from './storyAiQueueModel.js';

// This is a local serial scheduler, not a remote cancellation or exactly-once billing service.
export function createStoryAiQueueRunner({ ownerId, execute, beforeRequest, checkpoint = null }) {
  let jobs = [], busy = false, intent = false, disposed = false, stopped = false;
  let completion = Promise.resolve();
  const listeners = new Set();
  function freezeInput(job) {
    for (const kind of ['characters', 'scenes']) { job.input[kind].forEach(Object.freeze); Object.freeze(job.input[kind]); }
    Object.freeze(job.input); Object.freeze(job.model); return job;
  }
  function emit() { for (const listener of listeners) { try { listener(); } catch (error) { console.error('Queue view update failed', error); } } }
  function idle() { if (busy || disposed) throw new Error('请等待当前请求结束，或重新打开队列'); }
  function find(id) { const job = jobs.find(item => item.id === id); if (!job) throw new Error('任务不存在'); return job; }
  function validate(job) {
    try { const proposal = parseStoryAiShotsProposal(job.raw, storyAiQueueTask(job)); job.status = 'ready'; job.error = ''; return proposal; }
    catch (error) { job.status = 'invalid'; job.error = String(error.message).slice(0, 600); throw error; }
  }
  async function pump() {
    idle(); stopped = false; intent = true; busy = true; emit();
    try {
      while (intent && !disposed) {
        const job = jobs.find(item => item.status === 'queued');
        if (!job) break;
        try { beforeRequest(job); }
        catch (error) { job.status = 'blocked'; job.error = String(error.message).slice(0, 600); intent = false; emit(); break; }
        if (job.attempts >= STORY_AI_QUEUE_LIMITS.attempts) { job.status = 'blocked'; job.error = '已到每项3次尝试上限，请核对记录'; intent = false; emit(); break; }
        const task = storyAiQueueTask(job);
        // Record uncertainty before invoking a potentially billable executor.
        job.status = 'running'; job.attempts++; job.error = '';
        if (checkpoint) {
          emit();
          try { await checkpoint(); }
          catch {
            job.status = 'blocked'; job.attempts--; job.error = '发送前本地保存失败，本项未调用模型；请修复保存或明确关闭自动保存后重新排队';
            intent = false; emit(); break;
          }
          if (!intent || disposed) {
            job.status = stopped ? 'cancelled' : 'queued'; job.attempts--; emit();
            try { await checkpoint(); } catch { /* The prior running marker remains uncertain on recovery. */ }
            break;
          }
          // Persistence yielded to the event loop; recheck source and shared request gate before dispatch.
          try { beforeRequest(job); }
          catch (error) {
            job.status = 'blocked'; job.attempts--; job.error = String(error.message).slice(0, 600); intent = false; emit();
            try { await checkpoint(); } catch {}
            break;
          }
        }
        try {
          const request = execute(task, job.model); emit();
          const response = await request;
          if (typeof response?.text !== 'string' || response.text.length > STORY_AI_LIMITS.response) {
            job.status = 'invalid'; job.error = '返回内容为空或过大，未保存超限内容；不会自动重发'; intent = false;
          } else {
            job.raw = response.text;
            try { validate(job); } catch { intent = false; }
          }
        } catch {
          // Provider errors may contain secrets, so do not copy raw errors into portable snapshots.
          job.status = 'unknown'; job.error = '请求失败或连接中断，无法确认厂商是否已执行/计费；请核对厂商记录，不会自动重试'; intent = false;
        }
        emit();
        if (checkpoint) {
          try { await checkpoint(); }
          catch { intent = false; job.error = '任务状态及已返回结果仍在内存，本地保存失败；请修复保存或导出快照'; emit(); }
        }
      }
    } finally { busy = false; intent = false; emit(); }
  }
  function start() {
    if (busy || disposed) return Promise.reject(new Error('请等待当前请求结束，或重新打开队列'));
    let complete; completion = new Promise(resolve => { complete = resolve; });
    const run = pump(); void run.then(() => complete(), () => complete()); return run;
  }
  return {
    waitUntilIdle() { return completion; },
    getJobs() { return jobs.map(job => ({ ...job })); },
    isBusy() { return busy; },
    isRunning() { return intent; },
    hasJobs() { return jobs.length > 0; },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    replace(next) {
      idle();
      // Validate the whole batch before replacing existing state; do not use restore semantics here.
      const snapshot = serializeStoryAiQueue(ownerId, next);
      const safe = JSON.parse(snapshot).jobs;
      if (safe.some(job => job.status !== 'queued' || job.attempts !== 0 || job.raw)) throw new Error('建立批次只接受新任务；旧记录请使用快照导入');
      jobs = safe.map(freezeInput); emit();
    },
    restore(raw) { idle(); const next = parseStoryAiQueueSnapshot(raw, ownerId); jobs = next.map(freezeInput); emit(); },
    snapshot() { return serializeStoryAiQueue(ownerId, jobs); },
    start,
    pause() { intent = false; emit(); },
    stopPending() { intent = false; stopped = true; for (const job of jobs) if (job.status === 'queued') job.status = 'cancelled'; emit(); },
    requeue(id) {
      idle(); const job = find(id);
      if (!['held', 'unknown', 'invalid', 'blocked', 'cancelled'].includes(job.status)) throw new Error('该状态不能重新排队');
      if (job.attempts >= STORY_AI_QUEUE_LIMITS.attempts) throw new Error('已到每项3次尝试上限');
      beforeRequest(job); job.status = 'queued'; job.raw = ''; job.error = ''; emit();
    },
    skip(id) { idle(); const job = find(id); if (job.status !== 'queued') throw new Error('只能跳过未发送项'); job.status = 'cancelled'; emit(); },
    editRaw(id, raw) {
      idle(); const job = find(id);
      if (!['ready', 'invalid', 'unknown'].includes(job.status)) throw new Error('当前状态不能修改结果');
      if (typeof raw !== 'string' || raw.length > STORY_AI_LIMITS.response) throw new Error('结果JSON超过256K字符上限');
      job.raw = raw; job.status = 'invalid'; job.error = 'JSON已修改，须重新校验'; emit();
    },
    validate(id) { idle(); const job = find(id); if (!['ready', 'invalid', 'unknown'].includes(job.status)) throw new Error('当前状态不能校验结果'); try { return validate(job); } finally { emit(); } },
    result(id) { idle(); const job = find(id); if (job.status !== 'ready') throw new Error('请先校验有效结果，已追加项不能重复确认'); return parseStoryAiShotsProposal(job.raw, storyAiQueueTask(job)); },
    markApplied(id) { idle(); const job = find(id); if (job.status !== 'ready') throw new Error('任务不是待审阅状态'); job.status = 'applied'; job.error = '只追加到草稿，不代表项目已应用或保存'; emit(); },
    reopenResult(id) { idle(); const job = find(id); if (job.status !== 'applied') throw new Error('仅用于重新开启已追加结果'); try { return validate(job); } finally { emit(); } },
    dispose() { intent = false; disposed = true; listeners.clear(); },
  };
}
