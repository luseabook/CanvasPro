/**
 * 桌面事件批量轮询处理器 —— 供 `/api/v2/desktop/events/poll` 使用。
 *
 * chrome-shell 运行时前端没有 IPC，只能通过 HTTP 轮询主进程的事件。若每个订阅
 * 各起一条定时器、各发一个请求，10 个订阅就是 10 份流量；这里把同一窗口内所有
 * 订阅路径合并进一次请求：
 *
 * - 事件路径（`consume-*`）：只关心「有没有新事件」，150ms 问一次，非空才返回；
 * - 快照路径（当前状态）：用 sha256 摘要当 revision，与客户端上报的 `known` 相同
 *   就不返回，间隔放宽到 1000ms（这类数据变化慢，问太勤没意义）；
 * - 最长挂起 1000ms：没有变化也要回一个空 updates，让前端拿到心跳而不是一直等；
 * - 单路径失败只进 `failed`，不连累同一批的其它路径 —— 否则一个坏接口会让所有
 *   订阅一起退避。
 *
 * 路径白名单是硬约束：客户端只允许订阅这几条，避免把任意 bridge 路由变成轮询目标。
 */
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

const MAX_PATHS_PER_REQUEST = 10;
const MAX_HOLD_MS = 1000;
const SNAPSHOT_INTERVAL_MS = 1000;
const EVENT_INTERVAL_MS = 150;
const SNAPSHOT_PATHS = new Set([
    '/api/v2/desktop/app/update-state',
    '/api/v2/desktop/screenshot/get-global-shortcut-status',
    '/api/v2/desktop/text-preset/get-global-shortcut-status',
    '/api/v2/desktop/media-task/list',
  ]),
  EVENT_PATHS = new Set([
    '/api/v2/desktop/project/consume-external-open-requests',
    '/api/v2/desktop/project/consume-package-progress-events',
    '/api/v2/desktop/asset/consume-updates',
    '/api/v2/desktop/notification/consume-generation-complete-clicks',
    '/api/v2/desktop/screenshot/consume-global-capture-events',
    '/api/v2/desktop/text-preset/consume-events',
  ]);

export function isDesktopEventPollPath(target) {
  return SNAPSHOT_PATHS.has(target) || EVENT_PATHS.has(target);
}

function revisionOf(value) {
  try {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex');
  } catch {
    return '';
  }
}

/**
 * @param {Map<string, Function>} routeTable bridge 路由表（已注册的路径才能被读）
 * @param {{ now?: Function, sleep?: Function, onError?: Function }} options
 * @returns {(payload: {paths?: string[], known?: Record<string, string>}, ctx?: {signal?: AbortSignal}) => Promise<{updates: object, failed: string[]}>}
 */
export function createDesktopEventPollHandler(
  // 名字按仓库习惯：routeTable 是主进程的 handle 表
  routeTable,
  { now = Date.now, sleep = delay, onError = () => {} } = {}
) {
  return async (payload = {}, { signal } = {}) => {
    const paths = Array.isArray(payload?.paths) ? [...new Set(payload.paths)] : [];
    if (
      !paths.length ||
      paths.length > MAX_PATHS_PER_REQUEST ||
      paths.some((path) => !isDesktopEventPollPath(path))
    )
      throw new Error('Invalid desktop event paths');
    const known = payload?.known && typeof payload.known === 'object' ? payload.known : {};
    const deadline = now() + MAX_HOLD_MS;
    const nextAllowed = new Map();
    while (!signal?.aborted) {
      const updates = {},
        failed = [];
      await Promise.all(
        paths.map(async (path) => {
          if (signal?.aborted || (nextAllowed.get(path) || 0) > now()) return;
          const isSnapshot = SNAPSHOT_PATHS.has(path);
          nextAllowed.set(path, now() + (isSnapshot ? SNAPSHOT_INTERVAL_MS : EVENT_INTERVAL_MS));
          try {
            const handler = routeTable.get(path);
            if (typeof handler !== 'function') throw new Error('Desktop event handler unavailable');
            const value =
              (await handler(path.endsWith('/media-task/list') ? { limit: 120 } : {})) ?? null;
            if (isSnapshot) {
              const revision = revisionOf(value);
              // revision 与客户端手上的一致 = 没变化，不回值，省掉一次序列化与去抖。
              if (revision !== known[path]) updates[path] = { value, revision };
            } else if (Array.isArray(value) && value.length) updates[path] = { value };
          } catch (error) {
            try {
              onError(path, error);
            } catch {}
            failed.push(path);
          }
        })
      );
      if (Object.keys(updates).length || failed.length || now() >= deadline)
        return { updates, failed };
      await sleep(Math.min(EVENT_INTERVAL_MS, Math.max(1, deadline - now())), undefined, {
        signal,
      });
    }
    return { updates: {}, failed: [] };
  };
}
