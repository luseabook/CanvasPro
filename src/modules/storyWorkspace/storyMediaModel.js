import { normalizeLocalPath } from '../../utils/localMediaPath.js';
import { validateExportMediaPath } from '../nodeExport/nodeMediaExportModel.js';

export const STORY_MEDIA_VERSION = 1;
const KINDS = ['image', 'video'];
const ID = /^[a-zA-Z0-9_-]{1,160}$/;
const RESERVED = new Set(['__proto__', 'constructor', 'prototype']);
function validId(value) { return typeof value === 'string' && ID.test(value) && !RESERVED.has(value); }
function assertKind(kind) { if (!KINDS.includes(kind)) throw new Error('只支持图片或视频镜头媒体'); }
export function normalizeStoryMediaRefs(value = []) {
  if (!Array.isArray(value) || value.length > 2) throw new Error('每镜最多关联一张图片和一段视频');
  const seen = new Set();
  return value.map(ref => {
    assertKind(ref?.kind);
    if (!validId(ref.nodeId) || seen.has(ref.kind)) throw new Error('镜头媒体关联无效或类型重复');
    seen.add(ref.kind);
    return { kind: ref.kind, nodeId: ref.nodeId };
  });
}
export function storyMediaPrompt(shot, kind) {
  assertKind(kind);
  // Deliberately no implicit character/scene references, HTML pills or media attachments.
  const value = shot?.[`${kind}Prompt`]?.trim() || shot?.description?.trim() || '';
  if (!value || value.length > 20000) throw new Error('请填写本镜提示词或画面描述（1–20000字符）');
  return value;
}
export function escapeStoryMediaPrompt(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\r\n?/g, '\n').replace(/\n/g, '<br>');
}
export function createStoryMediaSource({ workspaceNodeId, episodeId, shot, kind, nodeId }) {
  if (![workspaceNodeId, episodeId, shot?.id, nodeId].every(validId)) throw new Error('镜头来源标识无效');
  return { version: STORY_MEDIA_VERSION, workspaceNodeId, episodeId, shotId: shot.id, kind,
    nodeId, promptText: storyMediaPrompt(shot, kind) };
}
export function matchesStoryMediaSource(source, { workspaceNodeId, episodeId, shotId }, nodeId, kind) {
  return source?.version === STORY_MEDIA_VERSION && source.workspaceNodeId === workspaceNodeId &&
    source.episodeId === episodeId && source.shotId === shotId && source.nodeId === nodeId &&
    source.kind === kind && typeof source.promptText === 'string' && source.promptText.length > 0 && source.promptText.length <= 20000;
}
export function isStoryMediaSourceCurrent(source, shot) {
  try { return source.promptText === storyMediaPrompt(shot, source.kind); } catch { return false; }
}
export function collectStoryMediaModels(manifests, resolveExecution, kind) {
  assertKind(kind);
  const seen = new Set(), models = [];
  for (const manifest of manifests) {
    try {
      const provider = manifest?.provider, model = manifest?.modelId;
      if (typeof provider !== 'string' || !/^[a-z0-9_-]{1,60}$/.test(provider) || typeof model !== 'string' ||
          !model || model.length > 300 || /[\s\u0000-\u001f\u007f]/u.test(model) || model.includes('://')) continue;
      const { modelManifest: resolved, executionManifest: execution } = resolveExecution(model, { providerHint: provider });
      if ([resolved, execution].some(item => !item || item.provider !== provider || item.kind !== kind || item.adapterType !== 'modelApi') ||
          resolved.outputType !== kind || !resolved.inputSlots?.allowedKinds?.includes('text')) continue;
      if (Object.entries(resolved.inputSlots.minByKind || {}).some(([key, count]) => !Number.isFinite(count) || count < 0 || (key !== 'text' && count > 0))) continue;
      const key = JSON.stringify([provider, model]);
      if (seen.has(key)) continue;
      seen.add(key); models.push({ provider, model, label: `${provider} · ${String(manifest.displayName || model).slice(0, 200)} · ${model}` });
    } catch { /* An unavailable manifest must not prevent recovery of existing media. */ }
  }
  return models;
}
export function buildStoryMediaGenerationNode({ id, workspaceNodeId, episodeId, shot, kind, model, x = 0, y = 0, width = 380, height = 380 }) {
  const source = createStoryMediaSource({ workspaceNodeId, episodeId, shot, kind, nodeId: id });
  if (!model?.provider || !model?.model) throw new Error('请选择本机清单中的模型');
  // Do not spread a template/model/node: credentials, URLs, arbitrary parameters and references stay out.
  return { id, type: `ai-${kind}`, x, y, width, height, name: `镜头${kind === 'image' ? '图片' : '视频'} · ${shot.id.slice(-8)}`,
    model: model.model, provider: model.provider, prompt: escapeStoryMediaPrompt(source.promptText),
    needsAutoResize: true, storyMediaSource: source };
}
function originalLocalPath(item, kind) {
  const fields = kind === 'image' ? ['originalLocalPath', 'localPath', 'sourceUrl', 'imageUrl', 'url', 'src'] : ['localPath', 'videoUrl', 'url', 'src', 'sourceUrl'];
  const raw = fields.map(key => item?.[key]).find(value => typeof value === 'string' && value.trim());
  const path = normalizeLocalPath(raw || '');
  validateExportMediaPath(path, kind);
  return path;
}
export function readStoryMediaTask(node, context, shot) {
  const kind = node?.type === 'ai-image' ? 'image' : node?.type === 'ai-video' ? 'video' : '';
  if (!kind || !matchesStoryMediaSource(node.storyMediaSource, context, node.id, kind)) return null;
  return readStoryMediaTaskResults(node, kind, isStoryMediaSourceCurrent(node.storyMediaSource, shot));
}

// Shared result parser only. Callers must separately verify their shot/asset ownership.
export function readStoryMediaTaskResults(node, kind, current) {
  assertKind(kind);
  const base = { nodeId: node.id, kind, current, results: [] };
  if (node.isGenerating || ['running', 'queued', 'pending', 'processing', 'recovering'].includes(node.jobStatus)) {
    return { ...base, status: '进行中 / 恢复待核对（仅节点记录）' };
  }
  if (node.jobStatus !== 'success') {
    const status = ['error', 'failed', 'cancelled', 'canceled'].includes(node.jobStatus)
      ? '失败 / 已停止；不能据此判断厂商是否计费' : '尚无成功记录；请在原生成节点核对';
    if (node.storyMediaBatch?.state === 'attempted') return { ...base, status: '本批已尝试，结果待核对；不会自动重发' };
    return { ...base, status };
  }
  const collection = kind === 'image' ? node.images : node.videos;
  const items = Array.isArray(collection) && collection.length ? collection : [node];
  if (items.length > 100) return { ...base, rejectedCount: items.length, status: '结果超过100项，请先在原节点整理' };
  const results = [], rejected = [];
  items.forEach((item, index) => {
    if (!item || item.error) { rejected.push(index); return; }
    try {
      const localPath = originalLocalPath(item, kind);
      results.push({ index, localPath, key: JSON.stringify([node.id, index, localPath, node.generationStartTime || node.generationStartedAt || 0]) });
    } catch { rejected.push(index); }
  });
  return { ...base, results, rejectedCount: rejected.length, status: `${results.length} 个本地结果待人工核对${rejected.length ? `；${rejected.length} 项失败、远程或无本地原媒体` : ''}` };
}
export function buildStoryMediaResultNode({ id, node, context, shot, index, expectedKey, x = 0, y = 0 }) {
  const task = readStoryMediaTask(node, context, shot);
  if (!task?.current) throw new Error('镜头来源或提示词已变化，请重新建立任务；不会串联旧结果');
  const selected = task.results.find(result => result.index === index);
  if (!selected || selected.key !== expectedKey) throw new Error('生成状态或结果已变化，请刷新后重新选择');
  const source = createStoryMediaSource({ ...context, shot, kind: task.kind, nodeId: id });
  return { id, type: `source-${task.kind}`, x, y, width: 380, height: 280, needsAutoResize: true,
    name: `已采纳${task.kind === 'image' ? '图片' : '视频'} · ${shot.id.slice(-8)}`,
    src: '/' + selected.localPath, localPath: selected.localPath,
    ...(task.kind === 'image' ? { originalLocalPath: selected.localPath } : {}),
    storyMediaResult: { ...source, generationNodeId: node.id, resultIndex: index, resultKey: selected.key, localPath: selected.localPath } };
}
export function storyMediaBindingStatus(ref, nodes, context, shot) {
  const node = nodes?.[ref.nodeId];
  if (!node) return '关联结果节点已缺失；不会自动清除或替换';
  if (node.type !== `source-${ref.kind}` || !matchesStoryMediaSource(node.storyMediaResult, context, node.id, ref.kind)) return '结果来源不符；请重新采纳';
  try {
    if (originalLocalPath(node, ref.kind) !== node.storyMediaResult.localPath || normalizeLocalPath(node.src) !== node.storyMediaResult.localPath) return '结果节点媒体已更换；请重新采纳';
  } catch { return '结果节点没有受支持的本地原媒体'; }
  return isStoryMediaSourceCurrent(node.storyMediaResult, shot)
    ? '已关联本地结果（文件存在性未检查）' : '已关联旧提示词结果；请复核，不会自动替换';
}
