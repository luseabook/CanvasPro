import { storyId } from './storyWorkspaceModel.js';
import { STORY_AI_QUEUE_LIMITS } from './storyAiQueueModel.js';

export const STORY_QUEUE_DB = 'canvaspro.story-ai-queues.v1';
export const STORY_QUEUE_DB_LIMITS = Object.freeze({ records: 32, bytes: 64 * 1024 * 1024, timeout: 8000 });
export function getStoryQueueStorageScope(host, ownerId) {
  const project = host?.currentProjectId, canvas = host?.CanvasTabManager?.getActiveCanvasId?.();
  const file = host?._v2CurrentRecentProjectId || host?._v2CurrentProjectDisplayPath || host?._v2CurrentFile || '';
  if (typeof project !== 'string' || !project || (project === 'default_v2_project' && !file)) return null;
  if (typeof canvas !== 'string' || !canvas || typeof ownerId !== 'string' || !ownerId) return null;
  if ([project, file, canvas, ownerId].some(value => typeof value !== 'string' || value.length > 2048)) return null;
  return { ownerId, key: JSON.stringify(['story-queue-local.v1', project, file, canvas, ownerId]) };
}
function size(raw) {
  if (typeof raw !== 'string' || raw.length > STORY_AI_QUEUE_LIMITS.bytes) throw new Error('本地快照无效或超过8MiB');
  const bytes = new TextEncoder().encode(raw).length;
  if (bytes > STORY_AI_QUEUE_LIMITS.bytes) throw new Error('本地快照超过8MiB');
  return bytes;
}
export function createStoryQueueDatabase({ indexedDB = globalThis.indexedDB, locks = globalThis.navigator?.locks } = {}) {
  function open() {
    return new Promise((resolve, reject) => {
      if (!indexedDB) { reject(new Error('当前环境不支持 IndexedDB，请使用手动快照')); return; }
      let done = false, request;
      const timer = setTimeout(() => fail(new Error('打开本地数据库超时，请关闭其他旧版本窗口')), STORY_QUEUE_DB_LIMITS.timeout);
      function fail(error) { if (!done) { done = true; clearTimeout(timer); reject(error); } }
      try { request = indexedDB.open(STORY_QUEUE_DB, 1); }
      catch { fail(new Error('浏览器禁止本地数据库，请使用手动快照')); return; }
      request.onupgradeneeded = () => {
        if (done) { request.transaction.abort(); return; }
        const store = request.result.createObjectStore('queues', { keyPath: 'key' }); store.createIndex('bytes', 'bytes');
      };
      request.onerror = () => fail(new Error('无法打开本地数据库，可能是权限或版本问题'));
      request.onblocked = () => fail(new Error('本地数据库升级被其他窗口阻塞，请先关闭旧窗口'));
      request.onsuccess = () => {
        if (done) { request.result.close(); return; }
        done = true; clearTimeout(timer); const db = request.result; db.onversionchange = () => db.close(); resolve(db);
      };
    });
  }
  async function transaction(mode, action) {
    const db = await open();
    return new Promise((resolve, reject) => {
      let tx, result, reason, done = false;
      function finish(error) { if (done) return; done = true; clearTimeout(timer); db.close(); if (error) reject(error); else resolve(result); }
      const timer = setTimeout(() => { reason = new Error('本地数据库事务超时，不能确认保存成功'); try { tx?.abort(); } catch {} finish(reason); }, STORY_QUEUE_DB_LIMITS.timeout);
      function fail(error) { reason = error; try { tx.abort(); } catch { finish(reason); } }
      try {
        tx = db.transaction('queues', mode);
        tx.oncomplete = () => finish();
        tx.onabort = () => finish(reason || new Error('本地保存失败：请检查磁盘、浏览器配额或权限，并导出快照'));
        tx.onerror = () => { reason ||= new Error('本地数据库读写失败，请保留内存结果并手动导出'); };
        action(tx.objectStore('queues'), value => { result = value; }, fail);
      } catch (error) { finish(error); }
    });
  }
  function validateRecord(record) {
    if (!record) return null;
    if (typeof record.revision !== 'string' || !record.revision || record.revision.length > 200 || !Number.isFinite(record.updatedAt)) throw new Error('本地记录元数据损坏，不能作为已保存记录使用');
    size(record.raw); return record;
  }
  return {
    read(key) { return transaction('readonly', (store, result, fail) => { const request = store.get(key); request.onsuccess = () => { try { result(validateRecord(request.result)); } catch (error) { fail(error); } }; }); },
    write(key, raw, expectedRevision) {
      const bytes = size(raw);
      return transaction('readwrite', (store, result, fail) => {
        const request = store.get(key);
        request.onsuccess = () => {
          const existing = request.result;
          if ((existing?.revision ?? null) !== expectedRevision) { fail(new Error('本地记录已被其他会话修改，拒绝覆盖；请先导出内存快照再重新恢复')); return; }
          let count = 0, total = 0; const scan = store.index('bytes').openKeyCursor();
          scan.onsuccess = () => {
            const cursor = scan.result;
            if (cursor) {
              count++; total += Number(cursor.key) || 0;
              if (count > STORY_QUEUE_DB_LIMITS.records) { fail(new Error('本地队列数量异常，拒绝继续写入')); return; }
              cursor.continue(); return;
            }
            if ((!existing && count >= STORY_QUEUE_DB_LIMITS.records) || total - (existing?.bytes || 0) + bytes > STORY_QUEUE_DB_LIMITS.bytes) { fail(new Error('本地队列达到32条或64MiB上限，请先导出并删除不需要的本地记录')); return; }
            const value = { key, raw, bytes, revision: storyId('queue-save'), updatedAt: Date.now() }; store.put(value); result(value);
          };
        };
      });
    },
    remove(key, expectedRevision) {
      return transaction('readwrite', (store, result, fail) => {
        const request = store.get(key); request.onsuccess = () => {
          if ((request.result?.revision ?? null) !== expectedRevision) { fail(new Error('本地记录版本已改变，未删除')); return; }
          store.delete(key); result(null);
        };
      });
    },
    lock(key) {
      return new Promise((resolve, reject) => {
        if (!locks?.request) { reject(new Error('当前环境缺少 Web Locks，不能安全启用自动保存；仍可手动导出/导入')); return; }
        let settled = false;
        const timer = setTimeout(() => { if (!settled) { settled = true; reject(new Error('获取本地保存锁超时')); } }, STORY_QUEUE_DB_LIMITS.timeout);
        try {
          Promise.resolve(locks.request('story-ai-queue:' + key, { mode: 'exclusive', ifAvailable: true }, lock => {
            if (settled) return;
            settled = true; clearTimeout(timer);
            if (!lock) { reject(new Error('另一个窗口仍占用此队列的本地保存，请等待其结束并关闭自动保存')); return; }
            return new Promise(release => resolve(release));
          })).catch(() => { if (!settled) { settled = true; clearTimeout(timer); reject(new Error('无法取得本地保存锁，请使用手动快照')); } });
        } catch { settled = true; clearTimeout(timer); reject(new Error('浏览器不允许本地保存锁')); }
      });
    },
  };
}
