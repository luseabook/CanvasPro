/**
 * 后台下发的客户端配置（/api/client-config）在渲染层的单一读取入口。
 *
 * 后台（canvas-admin）把配置分成扁平键与结构化命名空间两类，客户端本地服务
 * 原样透传。这里只做「取一次、缓存、变更时通知」，不做任何业务判断——
 * 业务解析放在各自模块（例如 resolveTutorialOrigin）。
 *
 * 设计要点：
 * - 拉取失败必须静默：离线启动时不能因为拿不到配置就报错或卡住界面；
 * - 只接受对象，任何其他形状都视为未取到；
 * - 支持订阅，配置刷新后订阅者能重新读取（品牌/内容源会变）。
 */
let cachedConfig = null;
let inFlight = null;
const listeners = new Set();

function normalizePayload(body) {
  if (!body || typeof body !== 'object') return null;
  const data = body.data && typeof body.data === 'object' ? body.data : body;
  return data && typeof data === 'object' ? data : null;
}

export function getClientConfig() {
  return cachedConfig;
}

export function peekClientConfig() {
  return cachedConfig;
}

/** 订阅配置变更。返回取消订阅函数。已有缓存时会立即回调一次。 */
export function onClientConfigChange(listener) {
  if (typeof listener !== 'function') return () => {};
  listeners.add(listener);
  if (cachedConfig) {
    try {
      listener(cachedConfig);
    } catch {}
  }
  return () => listeners.delete(listener);
}

function emit() {
  for (const listener of listeners) {
    try {
      listener(cachedConfig);
    } catch {}
  }
}

/**
 * 拉取客户端配置。并发调用共享同一个请求；失败时返回上一次的缓存（可能为 null）。
 */
export async function loadClientConfig({ force = false } = {}) {
  if (cachedConfig && !force) return cachedConfig;
  if (inFlight) return inFlight;
  if (typeof fetch !== 'function') return cachedConfig;
  inFlight = (async () => {
    try {
      const response = await fetch('/api/client-config', { cache: 'no-store' });
      if (!response.ok) return cachedConfig;
      const next = normalizePayload(await response.json());
      if (next) {
        cachedConfig = next;
        emit();
      }
    } catch {
      // 离线或本地服务未就绪：保持旧值，不打断界面
    } finally {
      inFlight = null;
    }
    return cachedConfig;
  })();
  return inFlight;
}

/** 测试用：重置缓存与订阅者。 */
export function resetClientConfigStore() {
  cachedConfig = null;
  inFlight = null;
  listeners.clear();
}
