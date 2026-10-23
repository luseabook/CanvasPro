/**
 * 桌面事件轮询客户端（chrome-shell 运行时用）。
 *
 * 解决的问题：chrome-shell 模式下前端只能通过 HTTP 访问桌面后端，没有 IPC。
 * 早先的做法是每个订阅各自 setTimeout 定时拉一次 —— 10 个订阅就是 10 条定时器、
 * 10 个请求，且互相不知道对方在拉同一份数据。
 *
 * 这里的做法：
 * - 同一路径的多个订阅者共用一个在途请求（`requestBatch` 一次带多个 paths）；
 * - 后端不支持批量（404）时自动降级为逐路径快照（`requestSnapshot`），只降一次；
 * - 失败按指数退避（最多 10s）并把错误分发给该路径的所有订阅者；
 * - 请求里的 `known` 带上上次 revision，后端可据此判断是否有变化。
 *
 * 依赖全部可注入（timerHost / now / requestBatch / requestSnapshot），
 * 因此单测不需要真实定时器或网络。
 */
const MAX_BACKOFF_MS = 10000;

function createAbortError() {
  return Object.assign(new Error('Desktop event subscription stopped'), { name: 'AbortError' });
}

function backoffDelay(attempt) {
  // 1s, 2s, 4s, 8s, 10s（封顶）—— 连续失败时不要继续把后端打满。
  return Math.min(MAX_BACKOFF_MS, 1000 * 2 ** Math.min(attempt - 1, 4));
}

export function createDesktopEventPollClient({
  requestBatch,
  requestSnapshot,
  timerHost = globalThis,
  now = Date.now,
  minimumIntervalMs = 0,
}) {
  /** @type {Map<string, Array<{resolve:Function, reject:Function}>>} 等待该路径结果的订阅者 */
  const waiting = new Map();
  /** @type {Map<string, {revision?: unknown, value: unknown}>} 上次拿到的值与 revision */
  const cache = new Map();
  /** @type {Map<string, {count:number, at:number}>} 单路径失败计数与下次可重试时间 */
  const pathFailures = new Map();
  let inflight = false,
    inflightBatch = null,
    timer = null,
    timerAt = Infinity,
    batchFailures = 0,
    batchRetryAt = 0,
    batchUnsupported = false;

  async function requestPaths(paths) {
    // 先试批量接口；404 说明这个后端版本没有批量端点，降级为逐路径快照并记住。
    if (!batchUnsupported) {
      try {
        return await requestBatch(paths);
      } catch (error) {
        if (error?.status !== 404 || typeof requestSnapshot !== 'function') throw error;
        batchUnsupported = true;
      }
    }
    batchRetryAt = Math.max(batchRetryAt, now() + 1000);
    const updates = {},
      failed = [];
    await Promise.all(
      paths.paths.map(async (path) => {
        try {
          updates[path] = { value: await requestSnapshot(path) };
        } catch {
          failed.push(path);
        }
      })
    );
    return { updates, failed };
  }

  function schedule() {
    if (inflight || waiting.size === 0) return;
    // 最早「可以再拉」的时刻：所有等待路径里最早的那个，再加上退避与最小间隔。
    const earliest = Math.min(
      ...[...waiting.keys()].map((path) => pathFailures.get(path)?.at || 0)
    );
    const fireAt = Math.max(now(), batchRetryAt, earliest);
    if (timer !== null && timerAt <= fireAt) return;
    if (timer !== null) timerHost.clearTimeout(timer);
    timerAt = fireAt;
    timer = timerHost.setTimeout(flush, Math.max(0, fireAt - now()));
  }

  async function flush() {
    ((timer = null), (timerAt = Infinity));
    if (inflight || waiting.size === 0) return;
    const due = new Map(
      [...waiting].filter(([path]) => (pathFailures.get(path)?.at || 0) <= now())
    );
    if (due.size === 0) {
      schedule();
      return;
    }
    ((inflight = true), (batchRetryAt = now() + minimumIntervalMs), (inflightBatch = due));
    for (const path of due.keys()) waiting.delete(path);
    try {
      const response = await requestPaths({
        paths: [...due.keys()],
        known: Object.fromEntries(
          [...due.keys()]
            .filter((path) => cache.has(path))
            .map((path) => [path, cache.get(path).revision])
        ),
      });
      if (
        !response?.updates ||
        typeof response.updates !== 'object' ||
        Array.isArray(response.updates) ||
        !Array.isArray(response.failed)
      )
        throw new Error('Invalid desktop event response');
      for (const [path, pending] of due) {
        if (response.failed.includes(path)) {
          const count = (pathFailures.get(path)?.count || 0) + 1;
          (pathFailures.set(path, { count: count, at: now() + backoffDelay(count) }),
            pending.forEach(({ reject }) => reject(new Error('Desktop event read failed'))));
          continue;
        }
        pathFailures.delete(path);
        const update = response.updates[path];
        if (update?.revision) cache.set(path, update);
        // 后端说「没变化」时不带 value：用缓存里的上一次值，避免订阅方拿到 undefined。
        const value = update ? update.value : (cache.get(path)?.value ?? []);
        pending.forEach(({ resolve }) => resolve(value));
      }
      ((batchFailures = 0), (batchRetryAt = 0));
    } catch (error) {
      ((batchFailures += 1), (batchRetryAt = now() + backoffDelay(batchFailures)));
      for (const pending of due.values()) pending.forEach(({ reject }) => reject(error));
    } finally {
      ((inflight = false), (inflightBatch = null), schedule());
    }
  }

  return {
    /**
     * 等到该路径有下一次更新（长轮询语义）。signal 中止时以 AbortError 拒绝。
     * 多个订阅者同时读同一路径只会触发一次后端请求。
     */
    read(path, { signal } = {}) {
      return new Promise((resolve, reject) => {
        const stopped = () => createAbortError();
        if (signal?.aborted) {
          reject(stopped());
          return;
        }
        const entry = {
          resolve: (value) => {
            (signal?.removeEventListener('abort', onAbort), resolve(value));
          },
          reject: (error) => {
            (signal?.removeEventListener('abort', onAbort), reject(error));
          },
        };
        const onAbort = () => {
          // 可能还在排队（waiting），也可能已经进了在途批次（inflightBatch），两处都要摘。
          for (const bucket of [waiting, inflightBatch]) {
            const pending = bucket?.get(path),
              index = pending?.indexOf(entry) ?? -1;
            if (index >= 0) pending.splice(index, 1);
            if (bucket === waiting && pending?.length === 0) waiting.delete(path);
          }
          if (waiting.size === 0 && timer !== null) {
            (timerHost.clearTimeout(timer), (timer = null), (timerAt = Infinity));
          }
          entry.reject(stopped());
        };
        signal?.addEventListener('abort', onAbort, { once: true });
        // 已在飞的批次里已经有这个路径：直接挂上去，不要再排一次。
        if (inflightBatch?.has(path)) {
          inflightBatch.get(path).push(entry);
          return;
        }
        if (!waiting.has(path)) waiting.set(path, []);
        (waiting.get(path).push(entry), schedule());
      });
    },
  };
}
