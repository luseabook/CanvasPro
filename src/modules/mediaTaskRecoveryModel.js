// Read-only host queries and explicitly confirmed, independent result adoption.
const RECOVERABLE = new Map([
  ['storySequenceExport', 'video'], ['mediaClipExport', 'video'],
  ['videoReverse', 'video'], ['audioCompose', 'audio'],
]);
export function mediaTaskOwnsGuardedWriteback(task) {
  return task?.kind === 'storySequenceExport' || task?.history !== undefined;
}
export function normalizeRecoveryTaskId(value) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 256 || /[\x00-\x1f\x7f]/.test(value)) {
    throw new Error('请输入有效任务ID（最多256字符）');
  }
  return value.trim();
}
export async function readMediaTaskList(api, options = {}, timeoutMs = 12000) {
  if (typeof api?.list !== 'function') throw new Error('需要桌面媒体任务接口；不调用浏览器后端');
  const request = { limit: 500 };
  if (options.taskId !== undefined) request.taskId = normalizeRecoveryTaskId(options.taskId);
  let timer;
  try {
    const rows = await Promise.race([
      Promise.resolve().then(() => api.list(request)),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('查询超时，任务状态待核对；不会取消或重发任务')), timeoutMs); }),
    ]);
    if (!Array.isArray(rows) || rows.length > 500) throw new Error('宿主任务列表格式不受支持');
    return rows;
  } finally { clearTimeout(timer); }
}
export async function findMediaTask(api, taskId) {
  const id = normalizeRecoveryTaskId(taskId);
  const matches = (await readMediaTaskList(api, { taskId: id })).filter(task => task?.taskId === id);
  if (matches.length !== 1) throw new Error(matches.length > 1
    ? '宿主返回重复任务ID，请先核对，不取回结果'
    : '当前宿主未返回此任务。旧桌面仅能检索最近500条；重启可能已丢失记录。不代表未执行或未产出，请勿盲目重试。');
  return matches[0];
}
function checkedOutputPath(value) {
  if (typeof value !== 'string' || value.length > 2048 || !value.startsWith('output/') ||
      /[\\%?#:\x00-\x1f\x7f]/.test(value) || value !== value.trim() ||
      value.split('/').some(part => !part || part === '.' || part === '..' || part !== part.trim())) {
    throw new Error('只取回原宿主输出目录中的明确本地媒体路径');
  }
  return value;
}
function positive(value) { return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0; }
export function describeRecoverableTask(task) {
  const taskId = normalizeRecoveryTaskId(task?.taskId);
  const mediaType = RECOVERABLE.get(task?.kind);
  if (!mediaType || (task.source && task.source !== 'mediaTask')) throw new Error('此任务类型未接入独立素材取回，保留原任务操作');
  if (task.status !== 'complete' || task.result?.success !== true) throw new Error('仅能取回宿主明确完成且成功的结果；当前状态待核对');
  if (!positive(task.createdAt) || !positive(task.finishedAt)) throw new Error('任务时间记录不完整，请先核对');
  const result = task.result;
  const h = task.history;
  const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
  if (h !== undefined && (h?.version !== 1 || h.durable !== true || !uuid(h.recordId) || !uuid(h.sessionId) || !positive(h.savedAt))) {
    throw new Error('历史来源标记或写盘记录不完整，不自动取回');
  }
  const localPath = checkedOutputPath(result.localPath || result.path);
  if (result.localPath && result.path && result.localPath !== result.path) throw new Error('宿主结果路径不一致');
  if (!(mediaType === 'video' ? /\.mp4$/i : /\.mp3$/i).test(localPath)) throw new Error('结果扩展名与已核实的任务类型不一致');
  const duration = positive(mediaType === 'video' ? result.videoDuration : result.audioDuration);
  if (mediaType === 'video' && !duration) throw new Error('结果视频时长未知，不猜测或借用原节点数据');
  return {
    version: 1, taskId, kind: task.kind, createdAt: task.createdAt, finishedAt: task.finishedAt,
    originalNodeId: typeof task.nodeId === 'string' ? task.nodeId.slice(0, 256) : '',
    mediaType, localPath, duration,
    width: positive(result.videoWidth) <= 32768 ? positive(result.videoWidth) : 0,
    height: positive(result.videoHeight) <= 32768 ? positive(result.videoHeight) : 0,
    fps: positive(result.fps) <= 1000 ? positive(result.fps) : 0,
    ...(h ? { historyRecordId: h.recordId, historySessionId: h.sessionId } : {}),
  };
}
export function recoveryFingerprint(description) { return JSON.stringify(description); }
export function hasRecoveredMediaTask(nodes, description) {
  return Object.values(nodes || {}).some(node => {
    const record = node?.mediaTaskRecovery;
    return record?.version === 1 && record.taskId === description.taskId && record.createdAt === description.createdAt &&
      record.kind === description.kind && record.localPath === description.localPath &&
      (!record.historyRecordId || !description.historyRecordId ||
        record.historyRecordId === description.historyRecordId && record.historySessionId === description.historySessionId);
  });
}
export function buildRecoveredMediaFields(description, id, now = Date.now()) {
  // Description is built from the host whitelist, never spread a raw result onto a node.
  const d = description;
  const common = {
    id, type: `source-${d.mediaType}`, name: '任务取回 · ' + d.localPath.split('/').pop(),
    src: '/' + d.localPath, localPath: d.localPath, fileName: d.localPath.split('/').pop(),
    mediaTaskRecovery: {
      version: 1, taskId: d.taskId, kind: d.kind, createdAt: d.createdAt, finishedAt: d.finishedAt,
      originalNodeId: d.originalNodeId, localPath: d.localPath, recoveredAt: now,
      ...(d.historyRecordId ? { historyRecordId: d.historyRecordId, historySessionId: d.historySessionId } : {}),
    },
  };
  if (d.mediaType === 'audio') return { ...common, audioUrl: common.src, audioDuration: d.duration };
  return { ...common, videoUrl: common.src, originalLocalPath: d.localPath, displayLocalPath: d.localPath,
    videoWidth: d.width, videoHeight: d.height, naturalWidth: d.width, naturalHeight: d.height,
    videoDuration: d.duration, videoFps: d.fps };
}
const inFlightStores = new WeakSet();
export async function recoverMediaTaskResult({ api, preview, store, confirm, buildNode, commit, isCurrent = () => true }) {
  if (inFlightStores.has(store)) throw new Error('已有一次结果取回正在核对，请等待');
  const nodes = store.getStateRaw()?.nodes;
  if (!nodes) throw new Error('当前没有可写画布');
  const expected = recoveryFingerprint(describeRecoverableTask(preview));
  function assertTarget() {
    if (!isCurrent() || store.getStateRaw()?.nodes !== nodes) throw new Error('目标画布或查询面板已改变，未添加结果；请在目标画布重新取回');
  }
  inFlightStores.add(store);
  try {
    const description = describeRecoverableTask(await findMediaTask(api, preview.taskId));
    assertTarget();
    if (recoveryFingerprint(description) !== expected) throw new Error('任务结果记录已变化，请重新查询和确认');
    if (hasRecoveredMediaTask(nodes, description)) throw new Error('当前画布已有此任务的取回记录，请核对现有节点；未重复添加');
    if (!await confirm(description)) return null;
    assertTarget();
    // Confirm may be asynchronous in a host dialog. Re-read, but never enqueue/retry/probe.
    const verified = describeRecoverableTask(await findMediaTask(api, description.taskId));
    assertTarget();
    if (recoveryFingerprint(verified) !== expected) throw new Error('确认期间任务记录变化，未添加结果');
    if (hasRecoveredMediaTask(nodes, description)) throw new Error('确认期间已取回此任务，未重复添加');
    const node = buildNode(description, nodes);
    assertTarget();
    if (!node?.id || Object.hasOwn(nodes, node.id) || node.type !== `source-${description.mediaType}` || node.localPath !== description.localPath) throw new Error('素材节点构建冲突，未添加');
    if (typeof store.batch !== 'function') throw new Error('当前store不支持批量通知，未添加');
    try {
      store.batch(() => { store.addNode(node); store.setSelectedNodes([node.id]); });
      assertTarget();
      commit();
    } catch (error) {
      if (nodes[node.id]) throw new Error('独立结果节点已写入确认时的画布，但历史/界面更新未完成；请回该画布核对并保存，不要重复添加。' + (error?.message || ''));
      throw error;
    } // History only. User still saves the project through the original UI.
    return node;
  } finally { inFlightStores.delete(store); }
}
// Avoid a late list response replacing newer events (including processing progress).
export function createMediaTaskListRefresh({ api, onTask, onComplete }) {
  let revision = 0, generation = 0;
  const eventVersions = new Map();
  return {
    noteEvent(task) {
      eventVersions.set(task?.taskId, ++revision);
      if (eventVersions.size > 1000) { generation += 1; eventVersions.clear(); }
    },
    invalidate() { generation += 1; },
    async refresh() {
      const current = ++generation, started = revision;
      const rows = await readMediaTaskList(api);
      if (current !== generation) return false;
      for (const row of rows) {
        if (!row || typeof row.taskId !== 'string' || (eventVersions.get(row.taskId) || 0) > started) continue;
        onTask(row);
      }
      // Revisions older than this read cannot affect future reads.
      for (const [id, version] of eventVersions) if (version <= started) eventVersions.delete(id);
      onComplete?.(rows.length);
      return true;
    },
  };
}