import path from 'node:path';
import { constants } from 'node:fs';
import * as disk from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { MEDIA_TASK_HISTORY_LIMITS, captureMediaTaskHistory, emptyMediaTaskHistory, historyBytes,
  historyIsTerminal, selectMediaTaskHistory, validateMediaTaskHistoryFile } from '../src/modules/mediaTaskHistoryModel.js';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sameFile = (a, b) => a.dev === b.dev && a.ino === b.ino && a.size === b.size && a.mtimeMs === b.mtimeMs && a.ctimeMs === b.ctimeMs;
function failure(code, message) { const error = new Error(message); error.historyCode = code; return error; }
function publicFailure(error) {
  if (error?.historyCode) return error;
  if (error?.code === 'ENOSPC') return failure('disk-full', '历史写盘空间不足；本次记录已暂停，原任务不受影响');
  if (['EACCES', 'EPERM'].includes(error?.code)) return failure('permission', '历史文件权限/占用异常；未声称设置或摘要已保存');
  return failure('storage-error', '历史文件读写失败；请核对磁盘/权限，勿将未取得回执的记录当作已保存');
}

// A bounded log, not an execution queue. Loading/querying never invokes handlers, enqueue,
// cancellation or renderer update events. Only explicit opt-in enables observation writes.
export class MediaTaskHistoryStore {
  constructor({ storageRoot, fs = disk, now = Date.now, uuid = randomUUID, debounceMs = 500 } = {}) {
    if (typeof storageRoot !== 'string' || !path.isAbsolute(storageRoot)) throw new Error('历史存储根目录无效');
    this.base = path.resolve(storageRoot); this.fs = fs; this.now = now; this.uuid = uuid; this.debounceMs = debounceMs;
    this.sessionId = uuid(); this.identities = new WeakMap(); this.buffer = new Map(); this.records = new Map();
    this.committed = emptyMediaTaskHistory(); this.fileHash = null; this.anchor = null; this.enabled = false;
    this.controlRevision = 0; this.generation = 0; this.savedGeneration = 0; this.droppedCount = 0;
    this.bytes = 0; this.skipped = 0; this.notice = ''; this.problem = null; this.blocked = false; this.loaded = false;
    this.timer = null; this.configuring = false; this.tail = Promise.resolve(); this.ready = this.load();
  }
  async directory(create = false) {
    if (create) await this.fs.mkdir(this.base, { recursive: true });
    let base;
    try { base = await this.fs.lstat(this.base); } catch (error) { if (!create && error.code === 'ENOENT') return null; throw error; }
    if (base.isSymbolicLink() || !base.isDirectory()) throw failure('unsafe-root', '历史根目录不是普通目录；拒绝跟随链接');
    const physical = await this.fs.realpath(this.base);
    if (this.anchor && this.anchor !== physical) throw failure('external-change', '历史存储根目录已改变，请核对后重启宿主');
    this.anchor = physical;
    const directory = path.join(physical, 'MediaTaskHistory');
    if (create) { try { await this.fs.mkdir(directory); } catch (error) { if (error.code !== 'EEXIST') throw error; } }
    let stat;
    try { stat = await this.fs.lstat(directory); } catch (error) { if (!create && error.code === 'ENOENT') return null; throw error; }
    if (stat.isSymbolicLink() || !stat.isDirectory() || await this.fs.realpath(directory) !== directory) throw failure('unsafe-root', '历史目录含链接或路径跳转');
    return directory;
  }
  async readDisk() {
    const directory = await this.directory();
    if (!directory) return { file: emptyMediaTaskHistory(), digest: null };
    const filename = path.join(directory, 'history.json'); let before;
    try { before = await this.fs.lstat(filename); } catch (error) { if (error.code === 'ENOENT') return { file: emptyMediaTaskHistory(), digest: null }; throw error; }
    if (before.isSymbolicLink() || !before.isFile() || before.nlink > 1 || before.size > MEDIA_TASK_HISTORY_LIMITS.bytes) throw failure('invalid-file', '历史不是普通独立文件、含链接或超过8MiB；不会覆盖');
    let handle;
    try {
      handle = await this.fs.open(filename, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
      if (!sameFile(before, await handle.stat())) throw failure('external-change', '读取前历史文件发生变化');
      const bytes = Buffer.alloc(MEDIA_TASK_HISTORY_LIMITS.bytes + 1); let used = 0;
      while (used < bytes.length) {
        const read = await handle.read(bytes, used, bytes.length - used, null);
        if (!read.bytesRead) break;
        used += read.bytesRead;
      }
      if (used > MEDIA_TASK_HISTORY_LIMITS.bytes || !sameFile(before, await handle.stat()) || !sameFile(before, await this.fs.lstat(filename))) throw failure('external-change', '读取期间历史文件变化或超限');
      const data = bytes.subarray(0, used); let file;
      try { file = validateMediaTaskHistoryFile(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(data))); }
      catch { throw failure('invalid-file', '历史JSON损坏、版本/字段不受支持；保留原文件，不改成空历史'); }
      return { file, digest: hash(data) };
    } finally { await handle?.close(); }
  }
  pauseOnError(error, permanent = false) {
    this.problem = publicFailure(error); this.enabled = false; this.blocked ||= permanent;
    this.controlRevision += 1; clearTimeout(this.timer); this.timer = null;
  }
  async load() {
    try {
      const { file, digest } = await this.readDisk();
      this.committed = file; this.fileHash = digest; this.enabled = file.enabled; this.droppedCount = file.droppedCount;
      this.records = new Map(file.records.map(record => [record.recordId, record]));
      this.bytes = file.records.reduce((total, record) => total + historyBytes(record) + 1, 0);
    } catch (error) { this.pauseOnError(error, true); }
    this.loaded = true;
    const buffered = [...this.buffer.values()]; this.buffer.clear();
    if (this.enabled && !this.blocked) for (const record of buffered) this.accept(record);
  }
  statusNow() {
    return { version: 1, sessionId: this.sessionId, controlRevision: this.controlRevision,
      enabled: this.enabled, persistedEnabled: this.fileHash === null && this.blocked ? null : this.committed.enabled,
      savedAt: this.committed.savedAt, revision: this.committed.revision, pending: this.generation !== this.savedGeneration,
      count: this.committed.records.length, droppedCount: this.committed.droppedCount, skipped: this.skipped,
      notice: this.notice, problem: this.problem?.message || '', problemCode: this.problem?.historyCode || '',
      canWrite: !this.blocked, limits: MEDIA_TASK_HISTORY_LIMITS, path: path.join(this.base, 'MediaTaskHistory', 'history.json') };
  }
  async status() { await this.ready; return this.statusNow(); }
  observe(task, identity) {
    if (this.blocked || this.loaded && !this.enabled) return;
    try {
      if (!identity || typeof identity !== 'object') throw new Error('Missing native task identity');
      let recordId = this.identities.get(identity);
      if (!recordId) {
        recordId = this.uuid();
        if (this.records.has(recordId) || this.buffer.has(recordId)) throw new Error('Duplicate history identity');
        this.identities.set(identity, recordId);
      }
      const record = captureMediaTaskHistory(task, { recordId, sessionId: this.sessionId, now: this.now() });
      if (!this.loaded) {
        if (!this.buffer.has(recordId) && this.buffer.size >= MEDIA_TASK_HISTORY_LIMITS.records) throw new Error('History startup buffer full');
        this.buffer.set(recordId, record); return;
      }
      this.accept(record);
    } catch {
      this.skipped += 1; this.notice = '部分记录身份/字段不受支持或缓冲超限，未保存这些摘要；原任务继续，不自动重发';
    }
  }
  accept(record) {
    const previous = this.records.get(record.recordId);
    if (previous) {
      if (['sessionId', 'taskId', 'nodeId', 'kind', 'createdAt'].some(key => previous[key] !== record[key])) {
        this.skipped += 1; this.notice = '观察到任务身份变化，保留旧记录，不用新身份覆盖'; return;
      }
      if (JSON.stringify(previous) === JSON.stringify({ ...record, observedAt: previous.observedAt })) return;
    }
    const trial = new Map(this.records); trial.set(record.recordId, record);
    let dropped = this.droppedCount;
    let bytes = this.bytes - (previous ? historyBytes(previous) + 1 : 0) + historyBytes(record) + 1;
    const removable = [...trial.values()].filter(item => item.recordId !== record.recordId && (item.sessionId !== this.sessionId || historyIsTerminal(item.status)))
      .sort((a, b) => a.observedAt - b.observedAt || a.recordId.localeCompare(b.recordId));
    const tooLarge = () => trial.size > MEDIA_TASK_HISTORY_LIMITS.records || bytes > MEDIA_TASK_HISTORY_LIMITS.bytes - 1024;
    while (tooLarge() && removable.length) { const oldest = removable.shift(); trial.delete(oldest.recordId); bytes -= historyBytes(oldest) + 1; dropped += 1; }
    if (tooLarge()) { this.skipped += 1; this.notice = '历史容量被本进程未终止记录占满，部分摘要未记录；不会淘汰执行中任务或重发'; return; }
    this.records = trial; this.bytes = bytes; this.droppedCount = dropped; this.generation += 1;
    this.schedule(historyIsTerminal(record.status) ? 0 : this.debounceMs);
  }
  schedule(delay = this.debounceMs) {
    if (!this.enabled || this.blocked || this.problem || this.timer) return;
    this.timer = setTimeout(() => { this.timer = null; void this.flush({ automatic: true }).catch(() => {}); }, delay);
    this.timer.unref?.();
  }
  serial(action) {
    const result = this.tail.catch(() => {}).then(action); this.tail = result.catch(() => {}); return result;
  }
  async unchanged() {
    const current = await this.readDisk();
    if (current.digest !== this.fileHash) throw failure('external-change', '历史文件被其他实例或外部操作修改，停止覆盖；请核对后重启宿主');
    return current.file;
  }
  async atomicWrite(file, assertAllowed) {
    assertAllowed();
    const directory = await this.directory(true), target = path.join(directory, 'history.json');
    const lockPath = path.join(directory, 'history.lock'), nonce = this.uuid();
    const temporary = path.join(directory, `.history-${nonce}.tmp`); let lock, output, ownsLock = false, created = false, renamed = false;
    try {
      assertAllowed();
      try { lock = await this.fs.open(lockPath, 'wx', 0o600); ownsLock = true; }
      catch (error) { if (error.code === 'EEXIST') throw failure('locked', '历史写锁已存在，可能是另一实例或崩溃遗留；不抢锁、不自动删除'); throw error; }
      await lock.writeFile(nonce, 'utf8'); await lock.sync(); await lock.close(); lock = null;
      await this.unchanged();
      const data = Buffer.from(JSON.stringify(validateMediaTaskHistoryFile(file)), 'utf8');
      if (data.length > MEDIA_TASK_HISTORY_LIMITS.bytes) throw failure('capacity', '历史文件超过8MiB，未写入');
      output = await this.fs.open(temporary, 'wx', 0o600); created = true;
      await output.writeFile(data); await output.sync(); await output.close(); output = null;
      await this.unchanged(); assertAllowed();
      await this.fs.rename(temporary, target); renamed = true;
      const verified = await this.readDisk();
      if (verified.digest !== hash(data)) throw failure('readback', '历史已尝试落盘但读回不符，停止覆盖；不能当作保存成功');
      return verified;
    } finally {
      await output?.close().catch(() => {}); await lock?.close().catch(() => {});
      if (created && !renamed) await this.fs.unlink(temporary).catch(() => {});
      // Only remove our own lock. Never reclaim another instance's or a crash-stale lock.
      try {
        if (ownsLock) {
          const stat = await this.fs.lstat(lockPath);
          if (stat.isFile() && !stat.isSymbolicLink() && stat.size === nonce.length && await this.fs.readFile(lockPath, 'utf8') === nonce) await this.fs.unlink(lockPath);
        }
      } catch { /* A remaining lock is visible on the next explicit write attempt, never forcibly removed. */ }
    }
  }
  async flush({ assertAllowed = () => {}, automatic = false } = {}) {
    await this.ready;
    return this.serial(async () => {
      if (automatic && (!this.enabled || this.problem)) return this.statusNow();
      if (this.blocked) throw this.problem || failure('blocked', '历史文件不可写');
      if (this.generation === this.savedGeneration) return this.statusNow();
      const generation = this.generation;
      const file = { ...this.committed, revision: this.committed.revision + 1, enabled: this.enabled,
        savedAt: this.now(), droppedCount: this.droppedCount, records: [...this.records.values()] };
      try {
        const verified = await this.atomicWrite(file, assertAllowed);
        this.committed = verified.file; this.fileHash = verified.digest; this.savedGeneration = generation; this.problem = null;
        if (this.generation !== generation) this.schedule();
        return this.statusNow();
      } catch (error) {
        this.pauseOnError(error, ['external-change', 'invalid-file', 'unsafe-root', 'readback'].includes(error.historyCode));
        throw this.problem;
      }
    });
  }
  async configure({ enabled, expectedSession, expectedControlRevision }, { assertAllowed = () => {} } = {}) {
    await this.ready; assertAllowed();
    if (typeof enabled !== 'boolean' || expectedSession !== this.sessionId || expectedControlRevision !== this.controlRevision) throw failure('stale-control', '历史设置已变化，请先读取当前状态再操作');
    if (this.configuring) throw failure('busy', '已有历史设置操作正在进行，不自动重试');
    if (this.blocked) throw this.problem;
    this.configuring = true; this.controlRevision += 1; this.enabled = enabled; this.generation += 1;
    clearTimeout(this.timer); this.timer = null; this.problem = null;
    try { return await this.flush({ assertAllowed }); } finally { this.configuring = false; }
  }
  async read(options = {}) {
    await this.ready;
    return this.serial(async () => {
      if (this.blocked) throw this.problem;
      try { return selectMediaTaskHistory(await this.unchanged(), options); }
      catch (error) {
        if (error.historyCode || error.code) this.pauseOnError(error, true);
        throw error;
      }
    });
  }
}
