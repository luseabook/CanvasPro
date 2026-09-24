import { escapeStoryMediaPrompt, readStoryMediaTaskResults } from './storyMediaModel.js';
import { normalizeLocalPath } from '../../utils/localMediaPath.js';
import { validateExportMediaPath } from '../nodeExport/nodeMediaExportModel.js';
import { resolveGenerationInputImageUrl } from '../../services/imageReferenceUrlService.js';

const KINDS = { characters: '人物', scenes: '场景' };
const safeId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,160}$/.test(value) && !['__proto__', 'prototype', 'constructor'].includes(value);
export function storyAssetLabel(kind) {
  if (!Object.hasOwn(KINDS, kind)) throw new Error('只支持人物或场景资料');
  return KINDS[kind];
}
export function storyAssetPrompt(asset, assetKind) {
  const label = storyAssetLabel(assetKind);
  const name = typeof asset?.name === 'string' ? asset.name.trim() : '';
  const description = typeof asset?.description === 'string' ? asset.description.trim() : '';
  const prompt = `${label}参考图\n名称：${name}\n设定：${description}`;
  if (!name || name.length > 300 || !description || prompt.length > 20000) throw new Error('请填写资料名称与设定；完整待发送文字须在20000字符内');
  return prompt;
}
export function createStoryAssetSource({ workspaceNodeId, assetKind, asset, nodeId }) {
  if (![workspaceNodeId, asset?.id, nodeId].every(safeId)) throw new Error('资料媒体来源标识无效');
  return { version: 1, workspaceNodeId, assetKind, assetId: asset.id, nodeId, kind: 'image', promptText: storyAssetPrompt(asset, assetKind) };
}
export function matchesStoryAssetSource(source, { workspaceNodeId, assetKind, assetId }, nodeId) {
  return source?.version === 1 && source.kind === 'image' && source.workspaceNodeId === workspaceNodeId &&
    source.assetKind === assetKind && source.assetId === assetId && source.nodeId === nodeId &&
    Object.hasOwn(KINDS, assetKind) && typeof source.promptText === 'string' && source.promptText.length > 0 && source.promptText.length <= 20000;
}
export function isStoryAssetSourceCurrent(source, asset) {
  try { return source.promptText === storyAssetPrompt(asset, source.assetKind); } catch { return false; }
}
export function selectStoryAssets(workspace, assetKind, assetIds) {
  storyAssetLabel(assetKind);
  if (!Array.isArray(assetIds) || !assetIds.length || assetIds.length > 6 || new Set(assetIds).size !== assetIds.length || !assetIds.every(safeId)) {
    throw new Error('每批请选择1–6项不重复资料，不会静默截断');
  }
  const selected = new Set(assetIds), assets = workspace[assetKind].filter(asset => selected.has(asset.id));
  if (assets.length !== assetIds.length) throw new Error('所选资料已缺失');
  return assets;
}
export function buildStoryAssetGenerationNode({ id, workspaceNodeId, assetKind, asset, model, batchId, x = 0, y = 0, width = 380, height = 380 }) {
  if (!safeId(batchId) || typeof model?.provider !== 'string' || !/^[a-z0-9_-]{1,60}$/.test(model.provider) ||
      typeof model?.model !== 'string' || !model.model || model.model.length > 300 || /[\s\u0000-\u001f\u007f]/u.test(model.model) || model.model.includes('://')) {
    throw new Error('资料图片批次或模型标识无效');
  }
  const source = createStoryAssetSource({ workspaceNodeId, assetKind, asset, nodeId: id });
  return { id, type: 'ai-image', x, y, width, height, needsAutoResize: true,
    name: `${storyAssetLabel(assetKind)}图片 · ${asset.name.slice(0, 80)}`, model: model.model, provider: model.provider,
    prompt: escapeStoryMediaPrompt(source.promptText), storyAssetSource: source, storyMediaBatch: { version: 1, batchId, state: 'held' } };
}
export function readStoryAssetTask(node, context, asset) {
  if (node?.type !== 'ai-image' || node.storyMediaSource || !matchesStoryAssetSource(node.storyAssetSource, context, node.id)) return null;
  return readStoryMediaTaskResults(node, 'image', isStoryAssetSourceCurrent(node.storyAssetSource, asset));
}
export function buildStoryAssetResultNode({ id, node, context, asset, index, expectedKey, x = 0, y = 0 }) {
  const task = readStoryAssetTask(node, context, asset);
  if (!task?.current) throw new Error('资料名称、设定或来源已变化，不能串联旧结果');
  const selected = task.results.find(item => item.index === index);
  if (!selected || selected.key !== expectedKey) throw new Error('结果或生成批次已变化，请刷新后重新选择');
  const source = createStoryAssetSource({ ...context, asset, nodeId: id });
  return { id, type: 'source-image', x, y, width: 380, height: 280, needsAutoResize: true,
    name: `已采纳${storyAssetLabel(context.assetKind)}图 · ${asset.name.slice(0, 80)}`,
    src: '/' + selected.localPath, localPath: selected.localPath, originalLocalPath: selected.localPath,
    storyAssetResult: { ...source, generationNodeId: node.id, resultIndex: index, resultKey: selected.key, localPath: selected.localPath } };
}
export function readStoryAssetAcceptedImage({ nodes, context, asset, nodeId }) {
  const node = nodes[nodeId], source = node?.storyAssetResult;
  if (node?.type !== 'source-image' || node.storyMediaResult || !matchesStoryAssetSource(source, context, nodeId) || !isStoryAssetSourceCurrent(source, asset) ||
      typeof source.resultKey !== 'string' || !source.resultKey || source.resultKey.length > 4096) throw new Error('已采纳资料图来源不符或设定已变化，请重新采纳/绑定');
  validateExportMediaPath(source.localPath, 'image');
  if (node.isGenerating || ['src', 'localPath', 'originalLocalPath'].some(key => normalizeLocalPath(node[key]) !== source.localPath) ||
      normalizeLocalPath(resolveGenerationInputImageUrl(node)) !== source.localPath) throw new Error('已采纳资料图的本地原图路径或实际引用已改变');
  return { version: 1, nodeId, localPath: source.localPath, resultKey: source.resultKey };
}
export function normalizeStoryAssetReference(value, referenceNodeId) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 1 || !safeId(value.nodeId) ||
      value.nodeId !== referenceNodeId || typeof value.resultKey !== 'string' || !value.resultKey || value.resultKey.length > 4096) throw new Error('资料参考图来源记录无效');
  validateExportMediaPath(value.localPath, 'image');
  return { version: 1, nodeId: value.nodeId, localPath: value.localPath, resultKey: value.resultKey };
}
export function assertStoryAssetReference({ nodes, workspaceNodeId, assetKind, asset }) {
  const node = nodes[asset.referenceNodeId];
  if (asset.referenceImage === undefined && !node?.storyAssetResult) return; // Existing manual references keep their original contract.
  const expected = normalizeStoryAssetReference(asset.referenceImage, asset.referenceNodeId);
  const current = readStoryAssetAcceptedImage({ nodes, context: { workspaceNodeId, assetKind, assetId: asset.id }, asset, nodeId: asset.referenceNodeId });
  if (JSON.stringify(current) !== JSON.stringify(expected)) throw new Error('资料参考图已被替换，请重新显式绑定，不会自动换图');
}
export function assertStoryAssetReferences({ workspace, workspaceNodeId, nodes, episode = null }) {
  const usedCharacters = episode && new Set(episode.shots.flatMap(shot => shot.characterIds));
  const usedScenes = episode && new Set(episode.shots.map(shot => shot.sceneId).filter(Boolean));
  for (const assetKind of ['characters', 'scenes']) {
    const used = assetKind === 'characters' ? usedCharacters : usedScenes;
    for (const asset of workspace[assetKind]) {
      if (!used || used.has(asset.id)) assertStoryAssetReference({ nodes, workspaceNodeId, assetKind, asset });
    }
  }
}
export function assertStoryAssetReferenceChanges({ previous, workspace, workspaceNodeId, nodes }) {
  for (const assetKind of ['characters', 'scenes']) for (const asset of workspace[assetKind]) {
    const old = previous[assetKind].find(item => item.id === asset.id);
    if (old?.referenceNodeId !== asset.referenceNodeId || JSON.stringify(old?.referenceImage) !== JSON.stringify(asset.referenceImage)) {
      assertStoryAssetReference({ nodes, workspaceNodeId, assetKind, asset });
    }
  }
}
export function assertStoryAssetAddition({ node, workspace, workspaceNodeId, nodes }) {
  const source = node.storyAssetSource || node.storyAssetResult;
  if (!Object.hasOwn(KINDS, source?.assetKind)) throw new Error('资料媒体分类无效');
  const asset = workspace[source.assetKind].find(item => item.id === source.assetId);
  const context = { workspaceNodeId, assetKind: source?.assetKind, assetId: source?.assetId };
  if (!asset || node.storyMediaSource || node.storyMediaResult || node.storyMediaReference || !matchesStoryAssetSource(source, context, node.id) ||
      !isStoryAssetSourceCurrent(source, asset)) throw new Error('新资料媒体来源或设定不符，未写入');
  if (node.type === 'ai-image' && node.storyAssetSource && !node.storyAssetResult) {
    if (node.prompt !== escapeStoryMediaPrompt(source.promptText) || node.storyMediaBatch?.version !== 1 || !safeId(node.storyMediaBatch.batchId) || node.storyMediaBatch.state !== 'held') {
      throw new Error('资料图片提示词或未发送标记不符');
    }
    return;
  }
  if (node.type !== 'source-image' || !node.storyAssetResult || node.storyAssetSource) throw new Error('资料媒体只接受原图片生成或独立图片结果');
  const task = readStoryAssetTask(nodes[source.generationNodeId], context, asset);
  const selected = task?.current && task.results.find(item => item.index === source.resultIndex && item.key === source.resultKey);
  if (!selected || selected.localPath !== source.localPath) throw new Error('采纳前原结果已变化，未建立独立图片');
  readStoryAssetAcceptedImage({ nodes: { ...nodes, [node.id]: node }, context, asset, nodeId: node.id });
  if (Object.values(nodes).some(item => item.storyAssetResult?.resultKey === source.resultKey &&
      matchesStoryAssetSource(item.storyAssetResult, context, item.id))) throw new Error('该资料结果已采纳，请定位已有独立图片');
}
export function createStoryAssetBatchPolicy({ workspaceNodeId, assetKind, getAsset }) {
  storyAssetLabel(assetKind);
  return {
    targetLabel: '资料',
    validate(item, node) {
      const asset = getAsset(item.assetId);
      if (item.kind !== 'image' || item.assetKind !== assetKind || !asset || node?.storyMediaSource || node?.type !== 'ai-image' ||
          !matchesStoryAssetSource(node.storyAssetSource, { workspaceNodeId, assetKind, assetId: item.assetId }, item.nodeId) ||
          !isStoryAssetSourceCurrent(node.storyAssetSource, asset)) throw new Error('资料来源、名称或设定已变化，后续发送已停止');
      return node.storyAssetSource.promptText;
    },
    readTask(item, node) {
      return readStoryAssetTask(node, { workspaceNodeId, assetKind, assetId: item.assetId }, getAsset(item.assetId));
    },
  };
}
