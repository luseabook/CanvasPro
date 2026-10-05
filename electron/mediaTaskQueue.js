import { spawn } from 'node:child_process';
import path from 'node:path';
const TERMINAL_STATUSES = new Set(['complete', 'failed', 'cancelled']),
  RETRYABLE_SPAWN_ERROR_CODES = new Set(['UNKNOWN', 'EBUSY', 'EACCES']),
  DEFAULT_SPAWN_RETRY_DELAY_MS = 180,
  DEFAULT_SPAWN_MAX_ATTEMPTS = 2,
  MIN_TASK_PRIORITY = -100,
  MAX_TASK_PRIORITY = 100;
function clampProgress(value) {
  const item = Number(value);
  if (!Number.isFinite(item)) return 0;
  return Math.max(0, Math.min(1, item));
}
function normalizeTaskPriority(key) {
  const index = Number(key);
  if (!Number.isFinite(index)) return 0;
  return Math.max(MIN_TASK_PRIORITY, Math.min(MAX_TASK_PRIORITY, Math.trunc(index)));
}
function buildActiveMigrationIdentity(result, data = {}) {
  const enabled = String(data?.migrationKey || '').trim();
  if (!enabled) return '';
  return JSON.stringify([String(result || '').trim(), String(data?.purpose || '').trim(), enabled]);
}
function delay(target) {
  return new Promise((source) => {
    setTimeout(source, target);
  });
}
function shouldRetrySpawnError(next, current, entry) {
  if (current >= entry) return false;
  const record = String(next?.code || '').toUpperCase();
  return RETRYABLE_SPAWN_ERROR_CODES.has(record);
}
function createDefaultTaskId() {
  return 'media-task-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}
function parseFfmpegTimeSeconds(payload) {
  const enabled2 = String(payload || '').match(/time=(\d{2}):(\d{2}):(\d{2})(?:[.,](\d+))?/);
  if (!enabled2) return null;
  const handle = Number(enabled2[1]) || 0,
    state = Number(enabled2[2]) || 0,
    config = Number(enabled2[3]) || 0,
    scope = Number('0.' + (enabled2[4] || '0')) || 0;
  return handle * 3600 + state * 60 + config + scope;
}
function getCommandLabel(command) {
  const text = String(command || '').trim();
  if (!text) return 'media tool';
  const basename = path.basename(text);
  return basename || text;
}
export function createProcessStartError(command, args, options, cause, attempt) {
  const commandLabel = getCommandLabel(command),
    message = String(cause?.message || cause || 'unknown error'),
    error = new Error('Failed to start ' + commandLabel + ': ' + message, {
      cause: cause instanceof Error ? cause : undefined,
    });
  ((error.name = 'MediaTaskProcessStartError'),
    (error.command = String(command || '')),
    (error.commandLabel = commandLabel),
    (error.args = Array.isArray(args) ? args.map((arg) => String(arg)) : []),
    (error.cwd = String(options?.cwd || '')),
    (error.attempt = attempt));
  if (cause?.code != null) error.code = cause.code;
  if (cause?.errno != null) error.errno = cause.errno;
  if (cause?.syscall != null) error.syscall = cause.syscall;
  if (cause?.path != null) error.path = cause.path;
  return error;
}
export class MediaTaskProcessTimeoutError extends Error {
  constructor(command, timeoutMs) {
    (super(getCommandLabel(command) + ' timed out after ' + timeoutMs + 'ms'),
      (this.name = 'MediaTaskProcessTimeoutError'),
      (this.code = 'MEDIA_TASK_PROCESS_TIMEOUT'),
      (this.command = String(command || '')),
      (this.commandLabel = getCommandLabel(command)),
      (this.timeoutMs = timeoutMs));
  }
}
export class MediaTaskCancelledError extends Error {
  constructor(input = 'Media task cancelled') {
    (super(input), (this.name = 'MediaTaskCancelledError'));
  }
}
export class MediaTaskQueue {
  constructor({
    concurrency: concurrency = 2,
    handlers: handlers = {},
    onUpdate: onUpdate = null,
    onSnapshot: onSnapshot = null,
    onActivity: onActivity = null,
    idFactory: idFactory = createDefaultTaskId,
    spawnImpl: spawnImpl = spawn,
  } = {}) {
    ((this.concurrency = Math.max(1, Math.trunc(Number(concurrency) || 1))),
      (this.handlers = { ...handlers }),
      (this.onUpdate = typeof onUpdate === 'function' ? onUpdate : () => {}),
      (this.onSnapshot = typeof onSnapshot === 'function' ? onSnapshot : () => {}),
      (this.onActivity = typeof onActivity === 'function' ? onActivity : () => {}),
      (this.idFactory = typeof idFactory === 'function' ? idFactory : createDefaultTaskId),
      (this.spawnImpl = typeof spawnImpl === 'function' ? spawnImpl : spawn),
      (this.tasks = new Map()),
      (this.waiting = []),
      (this.activeMigrationTasks = new Map()),
      (this.active = 0));
  }
  ['setHandler'](output, value2) {
    const enabled3 = String(output || '').trim();
    if (!enabled3 || typeof value2 !== 'function') return;
    this.handlers[enabled3] = value2;
  }
  ['enqueue'](cancellable = {}) {
    const kind = String(cancellable?.kind || '').trim();
    if (!kind) throw new Error('Missing media task kind');
    const value3 = this.handlers[kind];
    if (typeof value3 !== 'function') throw new Error('Unsupported media task kind: ' + kind);
    const migrationIdentity = buildActiveMigrationIdentity(kind, cancellable);
    if (migrationIdentity) {
      const response = this.activeMigrationTasks.get(migrationIdentity);
      if (response && !TERMINAL_STATUSES.has(response.status)) return this._snapshot(response);
      this.activeMigrationTasks.delete(migrationIdentity);
    }
    // The map, cancellation and exact task lookup all use this ID. Reusing it would
    // overwrite the first task while its handler could still be running.
    const id = String(cancellable?.taskId || '').trim() || String(this.idFactory() || '').trim();
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,255}$/.test(id)) throw new Error('Invalid media task ID');
    if (this.tasks.has(id))
      throw new Error('Duplicate media task ID; inspect the existing task instead of retrying');
    const value4 = {
      id: id,
      taskId: id,
      kind: kind,
      nodeId: String(cancellable?.nodeId || '').trim(),
      payload: { ...cancellable, kind: kind, taskId: id },
      cancellable: cancellable?.cancellable === true,
      priority: normalizeTaskPriority(cancellable?.priority),
      status: 'waiting',
      progress: 0,
      stage: '',
      message: '',
      error: '',
      result: null,
      child: null,
      cancelRequested: false,
      migrationIdentity: migrationIdentity,
      createdAt: Date.now(),
      startedAt: 0,
      finishedAt: 0,
    };
    return (
      this.tasks.set(id, value4),
      migrationIdentity && this.activeMigrationTasks.set(migrationIdentity, value4),
      this.waiting.push(value4),
      this._emit(value4),
      this._pump(),
      this._snapshot(value4)
    );
  }
  ['cancel'](value5, value6 = {}) {
    const value7 = String(value5 || '').trim(),
      progress = this.tasks.get(value7);
    if (!progress) return { ok: false, error: 'Task not found' };
    if (value6?.onlyIfWaiting === true && progress.status !== 'waiting')
      return {
        ok: true,
        skipped: true,
        reason: TERMINAL_STATUSES.has(progress.status) ? 'task-already-finished' : 'task-already-started',
        task: this._snapshot(progress),
      };
    if (TERMINAL_STATUSES.has(progress.status)) return { ok: true, task: this._snapshot(progress) };
    progress.cancelRequested = true;
    if (progress.status === 'waiting')
      return (
        (this.waiting = this.waiting.filter((item2) => item2.id !== value7)),
        this._finish(progress, 'cancelled', { progress: progress.progress, message: 'Cancelled' }),
        this._pump(),
        { ok: true, task: this._snapshot(progress) }
      );
    if (progress.child && typeof progress.child.kill === 'function')
      try {
        progress.child.kill();
      } catch {}
    return (this._emit(progress, { message: 'Cancelling' }), { ok: true, task: this._snapshot(progress) });
  }
  ['get'](value8) {
    const value9 = this.tasks.get(String(value8 || '').trim());
    return value9 ? this._snapshot(value9) : null;
  }
  ['list']({ limit: limit = 100, taskId } = {}) {
    // Exact lookup reuses the original in-memory queue, not a persistent history.
    if (taskId !== undefined) {
      if (
        typeof taskId !== 'string' ||
        !taskId.trim() ||
        taskId.trim().length > 256 ||
        /[\x00-\x1f\x7f]/.test(taskId)
      ) {
        throw new Error('Invalid media task ID');
      }
      const task = this.get(taskId.trim());
      return task ? [task] : [];
    }
    const value10 = Math.max(1, Math.min(500, Math.trunc(Number(limit) || 100)));
    return [...this.tasks.values()]
      .sort((item3, value11) => Number(value11.createdAt || 0) - Number(item3.createdAt || 0))
      .slice(0, value10)
      .map((item4) => this._snapshot(item4));
  }
  ['getActivity']() {
    return this._activitySnapshot();
  }
  ['emitProgress'](error2, value12, value13 = '', value14 = {}) {
    if (!error2 || TERMINAL_STATUSES.has(error2.status)) return;
    error2.progress = clampProgress(value12);
    if (value14.stage != null) error2.stage = String(value14.stage || '');
    if (value13) error2.message = String(value13);
    this._emit(error2);
  }
  ['isCancelled'](value15) {
    return value15?.cancelRequested === true;
  }
  ['throwIfCancelled'](value16) {
    if (this.isCancelled(value16)) throw new MediaTaskCancelledError();
  }
  ['runProcess'](value17, value18, value19 = [], cwd = {}) {
    return (
      this.throwIfCancelled(value17),
      new Promise((value20, value21) => {
        const list = [],
          list2 = [],
          count = Number(cwd.durationSec || 0),
          stdio = cwd.input !== null && cwd.input !== undefined;
        let clampProgress2 = clampProgress(cwd.initialProgress || value17.progress || 0),
          value22 = false;
        const run = (handler, value23) => {
            if (value22) return;
            ((value22 = true), (value17.child = null), handler(value23));
          },
          value24 = Math.max(1, Math.trunc(Number(cwd.spawnMaxAttempts || DEFAULT_SPAWN_MAX_ATTEMPTS) || 1)),
          value25 = Math.max(
            0,
            Math.trunc(Number(cwd.spawnRetryDelayMs ?? DEFAULT_SPAWN_RETRY_DELAY_MS) || 0),
          ),
          count2 = Math.max(0, Math.trunc(Number(cwd.timeoutMs || 0) || 0)),
          handler2 = async (value26 = 1) => {
            if (value22) return;
            try {
              this.throwIfCancelled(value17);
            } catch (value27) {
              run(value21, value27);
              return;
            }
            let child = null;
            try {
              child = this.spawnImpl(value18, value19, {
                cwd: cwd.cwd,
                env: cwd.env,
                stdio: stdio ? ['pipe', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe'],
                windowsHide: true,
              });
            } catch (value28) {
              if (shouldRetrySpawnError(value28, value26, value24)) {
                (await delay(value25), await handler2(value26 + 1));
                return;
              }
              run(value21, createProcessStartError(value18, value19, cwd, value28, value26));
              return;
            }
            value17.child = child;
            let value29 = false,
              timer = null;
            const run2 = () => {
                if (timer) clearTimeout(timer);
                timer = null;
              },
              handler3 = (value30, value31) => {
                if (value29 || value22) return;
                value29 = true;
                if (value17.child === child) value17.child = null;
                (run2(), run(value30, value31));
              },
              handler4 = async (value32) => {
                if (value29 || value22) return;
                ((value29 = true), run2());
                if (value17.child === child) value17.child = null;
                if (shouldRetrySpawnError(value32, value26, value24) && !this.isCancelled(value17)) {
                  (await delay(value25), await handler2(value26 + 1));
                  return;
                }
                run(value21, createProcessStartError(value18, value19, cwd, value32, value26));
              };
            (child.stdout?.on('data', (value33) => list.push(Buffer.from(value33))),
              child.stderr?.on('data', (value34) => {
                const value35 = Buffer.from(value34);
                list2.push(value35);
                if (count > 0) {
                  const ffmpegTimeSeconds = parseFfmpegTimeSeconds(value35.toString('utf8'));
                  if (ffmpegTimeSeconds != null) {
                    const clampProgress3 = clampProgress(ffmpegTimeSeconds / count);
                    clampProgress3 >= clampProgress2 + 0.01 &&
                      ((clampProgress2 = clampProgress3),
                      this.emitProgress(value17, clampProgress3, cwd.progressMessage || ''));
                  }
                }
              }),
              child.once('error', (value36) => {
                void handler4(value36);
              }),
              child.once('exit', (code, signal) => {
                if (value29 || value22) return;
                if (this.isCancelled(value17)) {
                  handler3(value21, new MediaTaskCancelledError());
                  return;
                }
                if (code === 0) {
                  handler3(value20, {
                    stdout: Buffer.concat(list),
                    stderr: Buffer.concat(list2),
                    code: code,
                    signal: signal,
                  });
                  return;
                }
                const value37 =
                  Buffer.concat(list2).toString('utf8').trim() ||
                  value18 + ' exited with ' + (code ?? signal ?? 'unknown');
                handler3(value21, new Error(value37));
              }),
              count2 > 0 &&
                ((timer = setTimeout(() => {
                  if (value29 || value22) return;
                  const mediaTaskProcessTimeoutError = new MediaTaskProcessTimeoutError(value18, count2);
                  try {
                    child.kill();
                  } catch {}
                  handler3(value21, mediaTaskProcessTimeoutError);
                }, count2)),
                timer.unref?.()),
              stdio && child.stdin && child.stdin.end(cwd.input));
          };
        void handler2();
      })
    );
  }
  ['_pump']() {
    while (this.active < this.concurrency && this.waiting.length > 0) {
      let value38 = 0;
      for (let value39 = 1; value39 < this.waiting.length; value39 += 1) {
        const taskPriority = normalizeTaskPriority(this.waiting[value39]?.priority),
          taskPriority2 = normalizeTaskPriority(this.waiting[value38]?.priority);
        if (taskPriority > taskPriority2) value38 = value39;
      }
      const [response2] = this.waiting.splice(value38, 1);
      if (!response2 || TERMINAL_STATUSES.has(response2.status)) continue;
      this._run(response2);
    }
  }
  async ['_run'](response3) {
    ((this.active += 1),
      (response3.status = 'processing'),
      (response3.startedAt = Date.now()),
      (response3.progress = Math.max(response3.progress, 0.01)),
      this._emit(response3));
    try {
      const result2 = await this.handlers[response3.kind](response3, this);
      (this.throwIfCancelled(response3),
        this._finish(response3, 'complete', {
          progress: 1,
          message: 'Complete',
          result: result2 && typeof result2 === 'object' ? result2 : {},
        }));
    } catch (error3) {
      error3 instanceof MediaTaskCancelledError || this.isCancelled(response3)
        ? this._finish(response3, 'cancelled', { message: 'Cancelled', error: '' })
        : this._finish(response3, 'failed', {
            message: 'Failed',
            error: String(error3?.message || error3),
          });
    } finally {
      ((this.active -= 1), this._pump());
    }
  }
  ['_finish'](error4, value40, error5 = {}) {
    error4.status = value40;
    error4.migrationIdentity &&
      this.activeMigrationTasks.get(error4.migrationIdentity) === error4 &&
      this.activeMigrationTasks.delete(error4.migrationIdentity);
    ((error4.finishedAt = Date.now()), (error4.child = null));
    if (error5.progress != null) error4.progress = clampProgress(error5.progress);
    if (error5.stage != null) error4.stage = String(error5.stage || '');
    if (error5.message != null) error4.message = String(error5.message || '');
    if (error5.error != null) error4.error = String(error5.error || '');
    if (error5.result != null) error4.result = error5.result;
    this._emit(error4);
  }
  ['_emit'](error6, error7 = {}) {
    if (!error6) return;
    if (error7.progress != null) error6.progress = clampProgress(error7.progress);
    if (error7.message != null) error6.message = String(error7.message || '');
    if (error7.error != null) error6.error = String(error7.error || '');
    if (error7.result != null) error6.result = error7.result;
    const snapshot = this._snapshot(error6);
    // History observes a native task identity; it never restores tasks into this queue.
    // Observer/storage failure must not change task execution or trigger a retry.
    try {
      this.onSnapshot(snapshot, error6);
    } catch {
      /* The history service exposes its own failure status. */
    }
    (this.onUpdate(snapshot), this._emitActivity());
  }
  ['_emitActivity']() {
    this.onActivity(this._activitySnapshot());
  }
  ['_activitySnapshot']() {
    const activeCount = [...this.tasks.values()]
        .filter((response4) => response4.status === 'processing')
        .map((item5) => this._snapshot(item5)),
      waitingCount = this.waiting.filter((response5) => response5.status === 'waiting').length,
      value41 =
        activeCount.length > 0
          ? activeCount.reduce((item6, value42) => item6 + clampProgress(value42.progress), 0) /
            activeCount.length
          : 0;
    return {
      activeCount: activeCount.length,
      waitingCount: waitingCount,
      totalCount: activeCount.length + waitingCount,
      progress: clampProgress(value41),
      activeTasks: activeCount,
    };
  }
  ['_snapshot'](taskId2) {
    return {
      taskId: taskId2.id,
      nodeId: taskId2.nodeId,
      assetId: taskId2.payload?.assetId || '',
      kind: taskId2.kind,
      purpose: String(taskId2.payload?.purpose || ''),
      cancellable: taskId2.cancellable === true,
      priority: normalizeTaskPriority(taskId2.priority),
      status: taskId2.status,
      progress: clampProgress(taskId2.progress),
      stage: taskId2.stage || '',
      message: taskId2.message || '',
      error: taskId2.error || '',
      result: taskId2.result || null,
      createdAt: taskId2.createdAt,
      startedAt: taskId2.startedAt,
      finishedAt: taskId2.finishedAt,
    };
  }
}
export function __parseFfmpegTimeSecondsForTest(value43) {
  return parseFfmpegTimeSeconds(value43);
}
