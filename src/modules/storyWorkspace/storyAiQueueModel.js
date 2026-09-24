import { createStoryWorkspace, normalizeStoryWorkspace, storyId, STORY_LIMITS } from './storyWorkspaceModel.js';
import { createStoryAiShotsTask, parseStoryAiShotsProposal } from './storyAiShotsModel.js';
import { normalizeStoryAiModel } from './storyAiProviderModel.js';
import { STORY_AI_LIMITS } from './storyAiModel.js';

export const STORY_AI_QUEUE_SCHEMA = 'canvas-story-ai-queue.v1';
export const STORY_AI_QUEUE_LIMITS = Object.freeze({ jobs: 6, attempts: 3, bytes: 8 * 1024 * 1024 });
export const STORY_AI_QUEUE_LABELS = Object.freeze({ queued: '待发送', running: '请求中', ready: '待审阅', invalid: '结果需修正', unknown: '请求状态待核对', blocked: '来源或通道受阻', held: '导入后待核对', cancelled: '已跳过', applied: '已追加草稿（保存需自核）' });
function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('队列条目须为对象');
  return value;
}
function text(value, max, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error('队列文本字段无效或超长');
  return value;
}
function modelConfig(value) {
  return normalizeStoryAiModel(value);
}
function assets(value) {
  if (!Array.isArray(value) || value.length > 20) throw new Error('每个任务每类资料最多20项');
  return value.map(item => { object(item); return { id: text(item.id, 160, true), name: text(item.name, 300, true), description: text(item.description, 4000) }; });
}
function normalizeInput(value) {
  object(value);
  if (!Number.isInteger(value.count) || value.count < 1 || value.count > 32) throw new Error('队列目标镜数须为1–32');
  return { episodeId: text(value.episodeId, 160, true), episodeTitle: text(value.episodeTitle, 300), script: text(value.script, STORY_AI_LIMITS.source, true),
    count: value.count, direction: text(value.direction, 1000), characters: assets(value.characters), scenes: assets(value.scenes) };
}
export function storyAiQueueTask(job) {
  const input = normalizeInput(job.input), workspace = createStoryWorkspace();
  workspace.episodes = [{ id: input.episodeId, title: input.episodeTitle, script: input.script, shots: [] }];
  for (const kind of ['characters', 'scenes']) workspace[kind] = input[kind].map(asset => ({ ...asset, referenceNodeId: '' }));
  return createStoryAiShotsTask(workspace, input.episodeId, { count: input.count, direction: input.direction,
    characterIds: input.characters.map(asset => asset.id), sceneIds: input.scenes.map(asset => asset.id) });
}
export function assertStoryAiQueueSource(workspace, job) {
  const input = job.input;
  const current = createStoryAiShotsTask(workspace, input.episodeId, { count: input.count, direction: input.direction,
    characterIds: input.characters.map(asset => asset.id), sceneIds: input.scenes.map(asset => asset.id) });
  const expected = storyAiQueueTask(job);
  if (current.source.text !== expected.source.text || JSON.stringify(current.context) !== JSON.stringify(expected.context)) throw new Error('源正文或所选资料已改变；不会将过期输入发送给模型');
}
export function createStoryAiQueueBatch(workspace, episodeIds, model, options = {}) {
  const normalized = normalizeStoryWorkspace(workspace);
  if (!Array.isArray(episodeIds) || !episodeIds.length || episodeIds.length > STORY_AI_QUEUE_LIMITS.jobs || new Set(episodeIds).size !== episodeIds.length) throw new Error('每批选择1–6个不同单集');
  const selectedModel = modelConfig(model), jobs = episodeIds.map(episodeId => {
    const task = createStoryAiShotsTask(normalized, episodeId, options);
    const input = { episodeId, episodeTitle: normalized.episodes.find(episode => episode.id === episodeId).title,
      script: task.source.text, count: task.count, direction: options.direction ?? '', characters: [], scenes: [] };
    for (const kind of ['characters', 'scenes']) input[kind] = task.context[kind].map(({ id, name, description }) => ({ id, name, description }));
    return { id: storyId('story-job'), model: { ...selectedModel }, input, status: 'queued', attempts: 0, raw: '', error: '' };
  });
  const existing = normalized.episodes.reduce((sum, episode) => sum + episode.shots.length, 0);
  if (existing + jobs.reduce((sum, job) => sum + job.input.count, 0) > STORY_LIMITS.shots) throw new Error('整批目标镜数会超过工作室2000镜容量，请缩小批次');
  return jobs;
}
function normalizeJob(value, restore) {
  object(value);
  const id = text(value.id, 160, true);
  if (!/^[a-zA-Z0-9_-]+$/.test(id) || ['__proto__', 'constructor', 'prototype'].includes(id)) throw new Error('无效任务ID');
  if (typeof value.status !== 'string' || !Object.prototype.hasOwnProperty.call(STORY_AI_QUEUE_LABELS, value.status)) throw new Error('未知队列任务状态');
  if (!Number.isInteger(value.attempts) || value.attempts < 0 || value.attempts > STORY_AI_QUEUE_LIMITS.attempts) throw new Error('无效尝试次数');
  const job = { id, input: normalizeInput(value.input), model: modelConfig(value.model), status: value.status,
    attempts: value.attempts, raw: text(value.raw, STORY_AI_LIMITS.response), error: text(value.error, 600) };
  const task = storyAiQueueTask(job);
  if (restore) {
    if (job.status === 'running') { job.status = 'unknown'; job.error = '快照记录请求进行中，实际结果和计费未知；不得自动重发'; }
    else if (job.status === 'queued') { job.status = 'held'; job.error = '旧快照不证明任务尚未发送，请先核对厂商记录再显式排队'; }
    if (job.status === 'ready') {
      try { parseStoryAiShotsProposal(job.raw, task); }
      catch { job.status = 'invalid'; job.error = '导入结果未通过当前版本校验，请手动修正JSON'; }
    }
  }
  return job;
}
export function serializeStoryAiQueue(ownerId, jobs) {
  if (!Array.isArray(jobs) || jobs.length > STORY_AI_QUEUE_LIMITS.jobs) throw new Error('队列最多6项');
  const normalized = jobs.map(job => normalizeJob(job, false));
  if (new Set(normalized.map(job => job.id)).size !== normalized.length) throw new Error('重复任务ID');
  const raw = JSON.stringify({ schemaVersion: STORY_AI_QUEUE_SCHEMA, ownerId: text(ownerId, 300, true), jobs: normalized });
  if (new TextEncoder().encode(raw).length > STORY_AI_QUEUE_LIMITS.bytes) throw new Error('队列快照超过8MiB上限，不能导出');
  return raw;
}
export function parseStoryAiQueueSnapshot(raw, ownerId) {
  if (typeof raw !== 'string' || raw.length > STORY_AI_QUEUE_LIMITS.bytes || new TextEncoder().encode(raw).length > STORY_AI_QUEUE_LIMITS.bytes) throw new Error('队列快照超过8MiB');
  let value;
  try { value = object(JSON.parse(raw.replace(/^\uFEFF/, ''))); } catch { throw new Error('队列快照不是有效JSON对象'); }
  if (value.schemaVersion !== STORY_AI_QUEUE_SCHEMA || value.ownerId !== ownerId) throw new Error('队列版本或工作室节点ID不匹配，请打开原工作室');
  if (!Array.isArray(value.jobs) || value.jobs.length > STORY_AI_QUEUE_LIMITS.jobs) throw new Error('队列最多6项');
  const jobs = value.jobs.map(job => normalizeJob(job, true));
  if (new Set(jobs.map(job => job.id)).size !== jobs.length) throw new Error('重复任务ID');
  return jobs;
}
