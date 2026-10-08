/**
 * 后台运营内容（canvas-admin）的前端入口。
 *
 * 前端只与本地服务对话（/api/v2/admin-content/*），由 server.py 的运营网关代理到远端。
 * 这样远端地址、超时、离线降级都在一处处理，渲染层不用关心。
 *
 * 约定：所有只读接口在后端不可用时返回**空数组/空对象**而不是抛错——
 * 公告、推广位、目录都是增强项，不能因为拿不到就打断用户操作。
 */
const ADMIN_CONTENT_BASE = '/api/v2/admin-content';

async function requestJson(path, { method = 'GET', body = null, timeout = 8000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${path} 请求失败 (${response.status})`);
    const payload = await response.json();
    return payload?.data && typeof payload.data === 'object' ? payload.data : payload;
  } finally {
    clearTimeout(timer);
  }
}

/** 只读请求：失败时返回 fallback，不抛错。运营内容是增强项，不能打断用户操作。 */
async function getJson(path, fallback) {
  try {
    return await requestJson(path);
  } catch {
    return fallback;
  }
}

const postJson = async (path, body) => {
  try {
    return await requestJson(path, { method: 'POST', body });
  } catch (error) {
    // 写操作必须如实失败：优惠码兑换失败却返回成功，用户会以为已经生效。
    return { ok: false, error: 'REQUEST_FAILED', message: String(error?.message || error) };
  }
};

/** 公告（按套餐/版本过滤）。失败返回空数组。 */
export async function fetchAnnouncements({ plan = '', version = '' } = {}) {
  const query = new URLSearchParams();
  if (plan) query.set('plan', plan);
  if (version) query.set('version', version);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const data = await getJson(`${ADMIN_CONTENT_BASE}/announcements${suffix}`, { items: [] });
  return Array.isArray(data?.items) ? data.items : [];
}

/** 更新检查（通道 + 灰度由后台判定）。失败返回 { hasUpdate: false }。 */
export async function checkAppUpdate({ currentVersion = '', channel = 'stable', platform = 'win', installId = '' } = {}) {
  const query = new URLSearchParams({
    currentVersion,
    channel,
    platform,
  });
  if (installId) query.set('installId', installId);
  const data = await getJson(`${ADMIN_CONTENT_BASE}/app-version?${query.toString()}`, { hasUpdate: false });
  return data && typeof data === 'object' ? { hasUpdate: false, ...data } : { hasUpdate: false };
}

/** 内容目录（模型/定价/教程/更新说明）。失败返回空数组。 */
export async function fetchCatalog({ kind = '' } = {}) {
  const suffix = kind ? `?kind=${encodeURIComponent(kind)}` : '';
  const data = await getJson(`${ADMIN_CONTENT_BASE}/catalog${suffix}`, { items: [] });
  return Array.isArray(data?.items) ? data.items : [];
}

/** 推广位（供应商注册链接等）。失败返回空数组。 */
export async function fetchPromotions() {
  const data = await getJson(`${ADMIN_CONTENT_BASE}/promotions`, { items: [] });
  return Array.isArray(data?.items) ? data.items : [];
}

/** 后台下发的订阅门禁清单。失败返回空数组（此时由本地 manifest 兜底）。 */
export async function fetchSubscriptionGates() {
  const data = await getJson(`${ADMIN_CONTENT_BASE}/gates`, { items: [] });
  return Array.isArray(data?.items) ? data.items : [];
}

/** 提交客服工单。 */
export function submitFeedback({ installId = '', contact = '', category = 'other', content = '' } = {}) {
  return postJson(`${ADMIN_CONTENT_BASE}/feedback`, { installId, contact, category, content });
}

/** 兑换优惠码。 */
export function redeemCoupon({ code = '', plan = '', installId = '' } = {}) {
  return postJson(`${ADMIN_CONTENT_BASE}/coupon/redeem`, { code, plan, installId });
}

/** 上报客户端事件（运营分析用，非授权核心事件）。 */
export function reportEvent({ installId = '', deviceId = '', event = '', result = 'ok', appVersion = '', os = '', detail = null } = {}) {
  const body = { installId, deviceId, event, result, appVersion, os };
  if (detail && typeof detail === 'object') body.detail = detail;
  return postJson(`${ADMIN_CONTENT_BASE}/events`, body);
}

/** 强制丢弃网关缓存，下次拉取直接打到远端。 */
export async function refreshAdminContent() {
  return postJson(`${ADMIN_CONTENT_BASE}/refresh`, {});
}
