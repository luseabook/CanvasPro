import { spawn } from 'node:child_process';
import path from 'node:path';
const TERMINAL_STATUSES = new Set(['complete', 'failed', 'cancelled']),
  RETRYABLE_SPAWN_ERROR_CODES = new Set(['UNKNOWN', 'EBUSY', 'EACCES']),
  DEFAULT_SPAWN_RETRY_DELAY_MS = 180,
  DEFAULT_SPAWN_MAX_ATTEMPTS = 2,
  MIN_TASK_PRIORITY = -100,
  MAX_TASK_PRIORITY = 100;
function clampProgress(_0x318914) {
  const _0x46b4be = Number(_0x318914);
  if (!Number.isFinite(_0x46b4be)) return 0;
  return Math.max(0, Math.min(1, _0x46b4be));
}
function normalizeTaskPriority(_0x390a7d) {
  const _0x50fb20 = Number(_0x390a7d);
  if (!Number.isFinite(_0x50fb20)) return 0;
  return Math.max(MIN_TASK_PRIORITY, Math.min(MAX_TASK_PRIORITY, Math.trunc(_0x50fb20)));
}
function buildActiveMigrationIdentity(_0x1dc216, _0x205f3c = {}) {
  const _0x1e4e90 = String(_0x205f3c?.migrationKey || '').trim();
  if (!_0x1e4e90) return '';
  return JSON.stringify([
    String(_0x1dc216 || '').trim(),
    String(_0x205f3c?.purpose || '').trim(),
    _0x1e4e90,
  ]);
}
function delay(_0x5612fc) {
  return new Promise((_0x251c94) => {
    setTimeout(_0x251c94, _0x5612fc);
  });
}
function shouldRetrySpawnError(_0x24c393, _0x946fc2, _0x176798) {
  if (_0x946fc2 >= _0x176798) return false;
  const _0x2345ee = String(_0x24c393?.code || '').toUpperCase();
  return RETRYABLE_SPAWN_ERROR_CODES.has(_0x2345ee);
}
function createDefaultTaskId() {
  return 'media-task-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}
function parseFfmpegTimeSeconds(_0x3a257a) {
  const _0x298410 = String(_0x3a257a || '').match(/time=(\d{2}):(\d{2}):(\d{2})(?:[.,](\d+))?/);
  if (!_0x298410) return null;
  const _0x126415 = Number(_0x298410[1]) || 0,
    _0x55d0d6 = Number(_0x298410[2]) || 0,
    _0x5967b7 = Number(_0x298410[3]) || 0,
    _0x3291a6 = Number('0.' + (_0x298410[4] || '0')) || 0;
  return _0x126415 * 0xe10 + _0x55d0d6 * 60 + _0x5967b7 + _0x3291a6;
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
  constructor(_0x31a4f4 = 'Media task cancelled') {
    (super(_0x31a4f4), (this.name = 'MediaTaskCancelledError'));
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
  ['setHandler'](_0x291651, _0x3ba639) {
    const _0x103ca0 = String(_0x291651 || '').trim();
    if (!_0x103ca0 || typeof _0x3ba639 !== 'function') return;
    this.handlers[_0x103ca0] = _0x3ba639;
  }
  ['enqueue'](_0x1c9f59 = {}) {
    const _0x390698 = String(_0x1c9f59?.kind || '').trim();
    if (!_0x390698) throw new Error('Missing media task kind');
    const _0x374920 = this.handlers[_0x390698];
    if (typeof _0x374920 !== 'function') throw new Error('Unsupported media task kind: ' + _0x390698);
    const _0x340ee6 = buildActiveMigrationIdentity(_0x390698, _0x1c9f59);
    if (_0x340ee6) {
      const _0x135176 = this.activeMigrationTasks.get(_0x340ee6);
      if (_0x135176 && !TERMINAL_STATUSES.has(_0x135176.status)) return this._snapshot(_0x135176);
      this.activeMigrationTasks.delete(_0x340ee6);
    }
    // The map, cancellation and exact task lookup all use this ID. Reusing it would
    // overwrite the first task while its handler could still be running.
    const _0x6b29b7 = String(_0x1c9f59?.taskId || '').trim() || String(this.idFactory() || '').trim();
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,255}$/.test(_0x6b29b7)) throw new Error('Invalid media task ID');
    if (this.tasks.has(_0x6b29b7)) throw new Error('Duplicate media task ID; inspect the existing task instead of retrying');
    const _0x3fc6fe = {
        id: _0x6b29b7,
        taskId: _0x6b29b7,
        kind: _0x390698,
        nodeId: String(_0x1c9f59?.nodeId || '').trim(),
        payload: { ..._0x1c9f59, kind: _0x390698, taskId: _0x6b29b7 },
        cancellable: _0x1c9f59?.cancellable === true,
        priority: normalizeTaskPriority(_0x1c9f59?.priority),
        status: 'waiting',
        progress: 0,
        stage: '',
        message: '',
        error: '',
        result: null,
        child: null,
        cancelRequested: false,
        migrationIdentity: _0x340ee6,
        createdAt: Date.now(),
        startedAt: 0,
        finishedAt: 0,
      };
    return (
      this.tasks.set(_0x6b29b7, _0x3fc6fe),
      _0x340ee6 && this.activeMigrationTasks.set(_0x340ee6, _0x3fc6fe),
      this.waiting.push(_0x3fc6fe),
      this._emit(_0x3fc6fe),
      this._pump(),
      this._snapshot(_0x3fc6fe)
    );
  }
  ['cancel'](_0x4e270e, _0x5c4b7a = {}) {
    const _0x5478f6 = String(_0x4e270e || '').trim(),
      _0x5bff47 = this.tasks.get(_0x5478f6);
    if (!_0x5bff47) return { ok: false, error: 'Task not found' };
    if (_0x5c4b7a?.onlyIfWaiting === true && _0x5bff47.status !== 'waiting')
      return {
        ok: true,
        skipped: true,
        reason: TERMINAL_STATUSES.has(_0x5bff47.status)
          ? 'task-already-finished'
          : 'task-already-started',
        task: this._snapshot(_0x5bff47),
      };
    if (TERMINAL_STATUSES.has(_0x5bff47.status)) return { ok: true, task: this._snapshot(_0x5bff47) };
    _0x5bff47.cancelRequested = true;
    if (_0x5bff47.status === 'waiting')
      return (
        (this.waiting = this.waiting.filter((_0x145116) => _0x145116.id !== _0x5478f6)),
        this._finish(_0x5bff47, 'cancelled', { progress: _0x5bff47.progress, message: 'Cancelled' }),
        this._pump(),
        { ok: true, task: this._snapshot(_0x5bff47) }
      );
    if (_0x5bff47.child && typeof _0x5bff47.child.kill === 'function')
      try {
        _0x5bff47.child.kill();
      } catch {}
    return (this._emit(_0x5bff47, { message: 'Cancelling' }), { ok: true, task: this._snapshot(_0x5bff47) });
  }
  ['get'](_0x5c19a3) {
    const _0x53a1f3 = this.tasks.get(String(_0x5c19a3 || '').trim());
    return _0x53a1f3 ? this._snapshot(_0x53a1f3) : null;
  }
  ['list']({ limit: limit = 100, taskId } = {}) {
    // Exact lookup reuses the original in-memory queue, not a persistent history.
    if (taskId !== undefined) {
      if (typeof taskId !== 'string' || !taskId.trim() || taskId.trim().length > 256 || /[\x00-\x1f\x7f]/.test(taskId)) {
        throw new Error('Invalid media task ID');
      }
      const task = this.get(taskId.trim());
      return task ? [task] : [];
    }
    const _0x1f31fd = Math.max(1, Math.min(0x1f4, Math.trunc(Number(limit) || 100)));
    return [...this.tasks.values()]
      .sort((_0x4df45d, _0xa0b61a) => Number(_0xa0b61a.createdAt || 0) - Number(_0x4df45d.createdAt || 0))
      .slice(0, _0x1f31fd)
      .map((_0x2fd109) => this._snapshot(_0x2fd109));
  }
  ['getActivity']() {
    return this._activitySnapshot();
  }
  ['emitProgress'](_0x4e6961, _0x2cbbb4, _0x453f19 = '', _0x3a39b0 = {}) {
    if (!_0x4e6961 || TERMINAL_STATUSES.has(_0x4e6961.status)) return;
    _0x4e6961.progress = clampProgress(_0x2cbbb4);
    if (_0x3a39b0.stage != null) _0x4e6961.stage = String(_0x3a39b0.stage || '');
    if (_0x453f19) _0x4e6961.message = String(_0x453f19);
    this._emit(_0x4e6961);
  }
  ['isCancelled'](_0x27ac15) {
    return _0x27ac15?.cancelRequested === true;
  }
  ['throwIfCancelled'](_0x5e0641) {
    if (this.isCancelled(_0x5e0641)) throw new MediaTaskCancelledError();
  }
  ['runProcess'](_0x47f659, _0x1f3080, _0x458bc1 = [], _0x5de8f9 = {}) {
    return (
      this.throwIfCancelled(_0x47f659),
      new Promise((_0x332c25, _0x582225) => {
        const _0xde29bb = [],
          _0x26b4cd = [],
          _0x14d009 = Number(_0x5de8f9.durationSec || 0),
          _0x43f8df = _0x5de8f9.input !== null && _0x5de8f9.input !== undefined;
        let _0x2cee66 = clampProgress(_0x5de8f9.initialProgress || _0x47f659.progress || 0),
          _0x4d0a1a = false;
        const _0x52ad3f = (_0xa5b926, _0x404bc1) => {
            if (_0x4d0a1a) return;
            ((_0x4d0a1a = true), (_0x47f659.child = null), _0xa5b926(_0x404bc1));
          },
          _0x1f5e0c = Math.max(
            1,
            Math.trunc(Number(_0x5de8f9.spawnMaxAttempts || DEFAULT_SPAWN_MAX_ATTEMPTS) || 1),
          ),
          _0x2d7f4c = Math.max(
            0,
            Math.trunc(Number(_0x5de8f9.spawnRetryDelayMs ?? DEFAULT_SPAWN_RETRY_DELAY_MS) || 0),
          ),
          _0x223d2b = Math.max(0, Math.trunc(Number(_0x5de8f9.timeoutMs || 0) || 0)),
          _0x51c6c7 = async (_0x3e8ca2 = 1) => {
            if (_0x4d0a1a) return;
            try {
              this.throwIfCancelled(_0x47f659);
            } catch (_0x3b1e9f) {
              _0x52ad3f(_0x582225, _0x3b1e9f);
              return;
            }
            let _0x186dd5 = null;
            try {
              _0x186dd5 = this.spawnImpl(_0x1f3080, _0x458bc1, {
                cwd: _0x5de8f9.cwd,
                env: _0x5de8f9.env,
                stdio: _0x43f8df ? ['pipe', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe'],
                windowsHide: true,
              });
            } catch (_0x2b7d55) {
              if (shouldRetrySpawnError(_0x2b7d55, _0x3e8ca2, _0x1f5e0c)) {
                (await delay(_0x2d7f4c), await _0x51c6c7(_0x3e8ca2 + 1));
                return;
              }
              _0x52ad3f(
                _0x582225,
                createProcessStartError(_0x1f3080, _0x458bc1, _0x5de8f9, _0x2b7d55, _0x3e8ca2),
              );
              return;
            }
            _0x47f659.child = _0x186dd5;
            let _0x3c0d47 = false,
              _0x1d1e60 = null;
            const _0x1bd25c = () => {
                if (_0x1d1e60) clearTimeout(_0x1d1e60);
                _0x1d1e60 = null;
              },
              _0x1b1a24 = (_0x4758d5, _0x21ecf7) => {
                if (_0x3c0d47 || _0x4d0a1a) return;
                _0x3c0d47 = true;
                if (_0x47f659.child === _0x186dd5) _0x47f659.child = null;
                (_0x1bd25c(), _0x52ad3f(_0x4758d5, _0x21ecf7));
              },
              _0x3bd9ac = async (_0x5b7c42) => {
                if (_0x3c0d47 || _0x4d0a1a) return;
                ((_0x3c0d47 = true), _0x1bd25c());
                if (_0x47f659.child === _0x186dd5) _0x47f659.child = null;
                if (shouldRetrySpawnError(_0x5b7c42, _0x3e8ca2, _0x1f5e0c) && !this.isCancelled(_0x47f659)) {
                  (await delay(_0x2d7f4c), await _0x51c6c7(_0x3e8ca2 + 1));
                  return;
                }
                _0x52ad3f(
                  _0x582225,
                  createProcessStartError(_0x1f3080, _0x458bc1, _0x5de8f9, _0x5b7c42, _0x3e8ca2),
                );
              };
            (_0x186dd5.stdout?.on('data', (_0x3fff2f) => _0xde29bb.push(Buffer.from(_0x3fff2f))),
              _0x186dd5.stderr?.on('data', (_0x415969) => {
                const _0x5ae9e2 = Buffer.from(_0x415969);
                _0x26b4cd.push(_0x5ae9e2);
                if (_0x14d009 > 0) {
                  const _0x2ba9ec = parseFfmpegTimeSeconds(_0x5ae9e2.toString('utf8'));
                  if (_0x2ba9ec != null) {
                    const _0x4560e4 = clampProgress(_0x2ba9ec / _0x14d009);
                    _0x4560e4 >= _0x2cee66 + 0.01 &&
                      ((_0x2cee66 = _0x4560e4),
                      this.emitProgress(_0x47f659, _0x4560e4, _0x5de8f9.progressMessage || ''));
                  }
                }
              }),
              _0x186dd5.once('error', (_0x32a540) => {
                void _0x3bd9ac(_0x32a540);
              }),
              _0x186dd5.once('exit', (_0x1bc62e, _0x173f0f) => {
                if (_0x3c0d47 || _0x4d0a1a) return;
                if (this.isCancelled(_0x47f659)) {
                  _0x1b1a24(_0x582225, new MediaTaskCancelledError());
                  return;
                }
                if (_0x1bc62e === 0) {
                  _0x1b1a24(_0x332c25, {
                    stdout: Buffer.concat(_0xde29bb),
                    stderr: Buffer.concat(_0x26b4cd),
                    code: _0x1bc62e,
                    signal: _0x173f0f,
                  });
                  return;
                }
                const _0x3433b2 =
                  Buffer.concat(_0x26b4cd).toString('utf8').trim() ||
                  _0x1f3080 + ' exited with ' + (_0x1bc62e ?? _0x173f0f ?? 'unknown');
                _0x1b1a24(_0x582225, new Error(_0x3433b2));
              }),
              _0x223d2b > 0 &&
                ((_0x1d1e60 = setTimeout(() => {
                  if (_0x3c0d47 || _0x4d0a1a) return;
                  const _0x2f7457 = new MediaTaskProcessTimeoutError(_0x1f3080, _0x223d2b);
                  try {
                    _0x186dd5.kill();
                  } catch {}
                  _0x1b1a24(_0x582225, _0x2f7457);
                }, _0x223d2b)),
                _0x1d1e60.unref?.()),
              _0x43f8df && _0x186dd5.stdin && _0x186dd5.stdin.end(_0x5de8f9.input));
          };
        void _0x51c6c7();
      })
    );
  }
  ['_pump']() {
    while (this.active < this.concurrency && this.waiting.length > 0) {
      let _0x22afe2 = 0;
      for (let _0x219a79 = 1; _0x219a79 < this.waiting.length; _0x219a79 += 1) {
        const _0x30e06a = normalizeTaskPriority(this.waiting[_0x219a79]?.priority),
          _0x459c23 = normalizeTaskPriority(this.waiting[_0x22afe2]?.priority);
        if (_0x30e06a > _0x459c23) _0x22afe2 = _0x219a79;
      }
      const [_0x2f8d3c] = this.waiting.splice(_0x22afe2, 1);
      if (!_0x2f8d3c || TERMINAL_STATUSES.has(_0x2f8d3c.status)) continue;
      this._run(_0x2f8d3c);
    }
  }
  async ['_run'](_0xdee02c) {
    ((this.active += 1),
      (_0xdee02c.status = 'processing'),
      (_0xdee02c.startedAt = Date.now()),
      (_0xdee02c.progress = Math.max(_0xdee02c.progress, 0.01)),
      this._emit(_0xdee02c));
    try {
      const _0x5ccc1a = await this.handlers[_0xdee02c.kind](_0xdee02c, this);
      (this.throwIfCancelled(_0xdee02c),
        this._finish(_0xdee02c, 'complete', {
          progress: 1,
          message: 'Complete',
          result: _0x5ccc1a && typeof _0x5ccc1a === 'object' ? _0x5ccc1a : {},
        }));
    } catch (_0x53b066) {
      _0x53b066 instanceof MediaTaskCancelledError || this.isCancelled(_0xdee02c)
        ? this._finish(_0xdee02c, 'cancelled', { message: 'Cancelled', error: '' })
        : this._finish(_0xdee02c, 'failed', {
            message: 'Failed',
            error: String(_0x53b066?.message || _0x53b066),
          });
    } finally {
      ((this.active -= 1), this._pump());
    }
  }
  ['_finish'](_0x68ac50, _0x53f4b0, _0x30181e = {}) {
    _0x68ac50.status = _0x53f4b0;
    _0x68ac50.migrationIdentity &&
      this.activeMigrationTasks.get(_0x68ac50.migrationIdentity) === _0x68ac50 &&
      this.activeMigrationTasks.delete(_0x68ac50.migrationIdentity);
    ((_0x68ac50.finishedAt = Date.now()), (_0x68ac50.child = null));
    if (_0x30181e.progress != null) _0x68ac50.progress = clampProgress(_0x30181e.progress);
    if (_0x30181e.stage != null) _0x68ac50.stage = String(_0x30181e.stage || '');
    if (_0x30181e.message != null) _0x68ac50.message = String(_0x30181e.message || '');
    if (_0x30181e.error != null) _0x68ac50.error = String(_0x30181e.error || '');
    if (_0x30181e.result != null) _0x68ac50.result = _0x30181e.result;
    this._emit(_0x68ac50);
  }
  ['_emit'](_0x45405f, _0x4ce2a1 = {}) {
    if (!_0x45405f) return;
    if (_0x4ce2a1.progress != null) _0x45405f.progress = clampProgress(_0x4ce2a1.progress);
    if (_0x4ce2a1.message != null) _0x45405f.message = String(_0x4ce2a1.message || '');
    if (_0x4ce2a1.error != null) _0x45405f.error = String(_0x4ce2a1.error || '');
    if (_0x4ce2a1.result != null) _0x45405f.result = _0x4ce2a1.result;
    const snapshot = this._snapshot(_0x45405f);
    // History observes a native task identity; it never restores tasks into this queue.
    // Observer/storage failure must not change task execution or trigger a retry.
    try { this.onSnapshot(snapshot, _0x45405f); } catch { /* The history service exposes its own failure status. */ }
    (this.onUpdate(snapshot), this._emitActivity());
  }
  ['_emitActivity']() {
    this.onActivity(this._activitySnapshot());
  }
  ['_activitySnapshot']() {
    const _0x5a3df0 = [...this.tasks.values()]
        .filter((_0x2b25ce) => _0x2b25ce.status === 'processing')
        .map((_0x21d9e1) => this._snapshot(_0x21d9e1)),
      _0x3c3cfb = this.waiting.filter((_0x4f4255) => _0x4f4255.status === 'waiting').length,
      _0x2b4d60 =
        _0x5a3df0.length > 0
          ? _0x5a3df0.reduce((_0x334550, _0x25416a) => _0x334550 + clampProgress(_0x25416a.progress), 0) /
            _0x5a3df0.length
          : 0;
    return {
      activeCount: _0x5a3df0.length,
      waitingCount: _0x3c3cfb,
      totalCount: _0x5a3df0.length + _0x3c3cfb,
      progress: clampProgress(_0x2b4d60),
      activeTasks: _0x5a3df0,
    };
  }
  ['_snapshot'](_0x1266a3) {
    return {
      taskId: _0x1266a3.id,
      nodeId: _0x1266a3.nodeId,
      assetId: _0x1266a3.payload?.assetId || '',
      kind: _0x1266a3.kind,
      purpose: String(_0x1266a3.payload?.purpose || ''),
      cancellable: _0x1266a3.cancellable === true,
      priority: normalizeTaskPriority(_0x1266a3.priority),
      status: _0x1266a3.status,
      progress: clampProgress(_0x1266a3.progress),
      stage: _0x1266a3.stage || '',
      message: _0x1266a3.message || '',
      error: _0x1266a3.error || '',
      result: _0x1266a3.result || null,
      createdAt: _0x1266a3.createdAt,
      startedAt: _0x1266a3.startedAt,
      finishedAt: _0x1266a3.finishedAt,
    };
  }
}
export function __parseFfmpegTimeSecondsForTest(_0x5e21aa) {
  return parseFfmpegTimeSeconds(_0x5e21aa);
}
