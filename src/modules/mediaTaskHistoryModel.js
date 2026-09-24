import { describeRecoverableTask } from './mediaTaskRecoveryModel.js';

export const MEDIA_TASK_HISTORY_VERSION = 1;
export const MEDIA_TASK_HISTORY_SCHEMA = 'canvas.media-task-history.v1';
export const MEDIA_TASK_HISTORY_LIMITS = Object.freeze({ records: 1000, bytes: 8 * 1024 * 1024, page: 50 });
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const ID = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,255}$/;
const STATES = new Set(['waiting', 'processing', 'complete', 'failed', 'cancelled']);
const TERMINAL = new Set(['complete', 'failed', 'cancelled']);
export const isHistoryUuid = value => typeof value === 'string' && UUID.test(value);
const integer = value => Number.isSafeInteger(value) && value >= 0;
const keysOnly = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).every(key => keys.includes(key));
export const historyBytes = value => new TextEncoder().encode(JSON.stringify(value)).length;
export const historyIsTerminal = status => TERMINAL.has(status);

// No payload, prompts, source URLs, asset IDs, stderr, exception messages or raw provider responses.
function outputSummary(task) {
  try {
    const d = describeRecoverableTask(task);
    return d.mediaType === 'video'
      ? { success: true, localPath: d.localPath, videoDuration: d.duration, videoWidth: d.width, videoHeight: d.height, fps: d.fps }
      : { success: true, localPath: d.localPath, audioDuration: d.duration };
  } catch { return null; }
}
function checkRecordIdentity(value) {
  if (!isHistoryUuid(value?.recordId) || !isHistoryUuid(value.sessionId) || typeof value.taskId !== 'string' || !ID.test(value.taskId) ||
      typeof value.nodeId !== 'string' || value.nodeId && !ID.test(value.nodeId) ||
      typeof value.kind !== 'string' || !/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(value.kind) || !STATES.has(value.status) ||
      !['createdAt', 'startedAt', 'finishedAt', 'observedAt'].every(key => integer(value[key])) || value.createdAt <= 0 || value.observedAt <= 0 ||
      TERMINAL.has(value.status) && value.finishedAt <= 0 || value.status === 'processing' && value.startedAt <= 0) {
    throw new Error('历史记录身份、状态或时间字段无效');
  }
}
export function captureMediaTaskHistory(task, { recordId, sessionId, now = Date.now() }) {
  const record = { recordId, sessionId, taskId: task?.taskId, nodeId: task?.nodeId || '', kind: task?.kind, status: task?.status,
    createdAt: task?.createdAt, startedAt: task?.startedAt || 0, finishedAt: task?.finishedAt || 0, observedAt: now, result: outputSummary(task) };
  checkRecordIdentity(record);
  return record;
}
export function validateMediaTaskHistoryRecord(value) {
  if (!keysOnly(value, ['recordId', 'sessionId', 'taskId', 'nodeId', 'kind', 'status', 'createdAt', 'startedAt', 'finishedAt', 'observedAt', 'result'])) {
    throw new Error('历史记录含未批准字段');
  }
  checkRecordIdentity(value);
  let result = null;
  if (value.result !== null) {
    result = outputSummary(value);
    if (!result || !keysOnly(value.result, Object.keys(result)) || Object.keys(result).some(key => value.result[key] !== result[key])) {
      throw new Error('历史结果摘要不符合已核对的四类本地输出白名单');
    }
  }
  return { recordId: value.recordId, sessionId: value.sessionId, taskId: value.taskId, nodeId: value.nodeId, kind: value.kind, status: value.status,
    createdAt: value.createdAt, startedAt: value.startedAt, finishedAt: value.finishedAt, observedAt: value.observedAt, result };
}
export function validateMediaTaskHistoryFile(value) {
  // Revision zero is only the in-memory representation of a missing file, never a saved opt-in receipt.
  if (!keysOnly(value, ['schema', 'revision', 'enabled', 'savedAt', 'droppedCount', 'records']) || value.schema !== MEDIA_TASK_HISTORY_SCHEMA ||
      !integer(value.revision) || value.revision === 0 || !integer(value.savedAt) || value.savedAt === 0 ||
      !integer(value.droppedCount) || typeof value.enabled !== 'boolean' ||
      !Array.isArray(value.records) || value.records.length > MEDIA_TASK_HISTORY_LIMITS.records ||
      historyBytes(value) > MEDIA_TASK_HISTORY_LIMITS.bytes) {
    throw new Error('本机历史版本、大小或结构无效；不会覆盖为新空文件');
  }
  const records = value.records.map(validateMediaTaskHistoryRecord);
  if (new Set(records.map(record => record.recordId)).size !== records.length) throw new Error('历史记录ID重复');
  return { schema: value.schema, revision: value.revision, enabled: value.enabled, savedAt: value.savedAt, droppedCount: value.droppedCount, records };
}
export function emptyMediaTaskHistory() {
  return { schema: MEDIA_TASK_HISTORY_SCHEMA, revision: 0, enabled: false, savedAt: 0, droppedCount: 0, records: [] };
}
export function historyTaskView(record, savedAt) {
  const r = validateMediaTaskHistoryRecord(record);
  return { taskId: r.taskId, nodeId: r.nodeId, kind: r.kind,
    status: r.status === 'waiting' ? 'held' : r.status === 'processing' ? 'unknown' : r.status,
    createdAt: r.createdAt, startedAt: r.startedAt, finishedAt: r.finishedAt, result: r.result ? { ...r.result } : null,
    history: { version: 1, recordId: r.recordId, sessionId: r.sessionId, durable: true, savedAt, observedAt: r.observedAt, observedStatus: r.status } };
}
export function normalizeMediaTaskHistoryQuery(value = {}) {
  if (!keysOnly(value, ['taskId', 'recordId', 'offset', 'limit'])) throw new Error('历史查询参数无效');
  const query = { offset: value.offset ?? 0, limit: value.limit ?? 20 };
  if (!integer(query.offset) || query.offset > MEDIA_TASK_HISTORY_LIMITS.records || !Number.isInteger(query.limit) || query.limit < 1 || query.limit > MEDIA_TASK_HISTORY_LIMITS.page) throw new Error('历史分页参数无效');
  if (value.recordId !== undefined) {
    if (!isHistoryUuid(value.recordId)) throw new Error('历史记录ID无效');
    query.recordId = value.recordId;
  }
  if (value.taskId !== undefined) {
    if (typeof value.taskId !== 'string' || !ID.test(value.taskId)) throw new Error('历史查询任务ID须为1–256位字母/数字或_.:-，不接受路径');
    query.taskId = value.taskId;
  }
  return query;
}
export function selectMediaTaskHistory(file, options = {}) {
  const query = normalizeMediaTaskHistoryQuery(options);
  const rows = file.records.filter(record => (!query.recordId || record.recordId === query.recordId) && (!query.taskId || record.taskId === query.taskId))
    .sort((a, b) => b.observedAt - a.observedAt || a.recordId.localeCompare(b.recordId));
  return { total: rows.length, offset: query.offset, rows: rows.slice(query.offset, query.offset + query.limit).map(record => historyTaskView(record, file.savedAt)) };
}
