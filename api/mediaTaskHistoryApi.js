import { isHistoryUuid, normalizeMediaTaskHistoryQuery } from '../src/modules/mediaTaskHistoryModel.js';

export function hasMediaTaskHistoryApi(api) {
  return ['status', 'read', 'configure', 'flush'].every(method => typeof api?.[method] === 'function');
}
export async function callMediaTaskHistory(api, method, request = {}, timeoutMs = 12000) {
  if (!hasMediaTaskHistoryApi(api) || !['status', 'read', 'configure', 'flush'].includes(method)) throw new Error('本机历史接口不可用，请更新并重启对应源码桌面端；不回退浏览器或旧队列');
  let timer;
  try {
    const response = await Promise.race([
      Promise.resolve().then(() => api[method](request)),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('历史操作等待超时；设置/写盘可能仍会完成，请先读取状态，勿直接重试。不会取消或重发媒体任务。')), timeoutMs); }),
    ]);
    if (response?.version !== 1 || typeof response.ok !== 'boolean') throw new Error('历史接口版本不符，请更新并重启对应桌面端');
    if (!response.ok) { const error = new Error(response.error || '历史操作未确认成功'); error.historyStatus = response.status; throw error; }
    return response;
  } finally { clearTimeout(timer); }
}
export async function readMediaTaskHistory(api, query) {
  const request = normalizeMediaTaskHistoryQuery(query);
  const response = await callMediaTaskHistory(api, 'read', request);
  if (!Array.isArray(response.rows) || response.rows.length > request.limit || !Number.isSafeInteger(response.total) || response.total < response.rows.length ||
      response.rows.some(task => task?.history?.version !== 1 || task.history.durable !== true || !isHistoryUuid(task.history.recordId) ||
        request.recordId && task.history.recordId !== request.recordId || request.taskId && task.taskId !== request.taskId)) throw new Error('历史查询返回结构或所选记录不符');
  return response;
}
// Pin recovery to one durable record, never to the first task with a reused taskId.
// It only exposes list(), so the original guarded adoption cannot enqueue/cancel/retry.
export function createMediaTaskHistoryReader(api, recordId) {
  if (!isHistoryUuid(recordId)) throw new Error('所选历史记录ID无效');
  return { async list({ taskId } = {}) {
    const response = await readMediaTaskHistory(api, { recordId, limit: 1 });
    if (response.rows.length !== 1 || response.rows[0].taskId !== taskId) throw new Error('所选历史记录已缺失、被保留策略淘汰或任务ID不符；未取回，不重发');
    return response.rows;
  } };
}
