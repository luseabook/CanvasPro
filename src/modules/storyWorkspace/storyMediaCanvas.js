import { getStoryReferenceVideoModel, buildStoryReferenceVideoPlan, assertStoryReferenceSource } from './storyReferenceVideo.js';
import { getModelsByKind, resolveModelExecution } from '../../manifests/index.js';
import { generateId } from '../../core/math.js';
import { calcSafeSpawnPosNearNode } from '../nodeSpawn.js';
import { getAIGenerationDefaultSizeByType, buildSourceMediaNodePayload } from '../../services/fileService.js';
import { buildStoryMediaGenerationNode, buildStoryMediaResultNode, collectStoryMediaModels } from './storyMediaModel.js';

export function getStoryMediaModels(kind) {
  try { return collectStoryMediaModels(getModelsByKind(kind), resolveModelExecution, kind); }
  catch { return []; } // Catalog availability must not gate existing result recovery.
}
export function prepareStoryMediaGeneration({ nodes, workspaceNodeId, episodeId, shot, kind, model }) {
  const selected = getStoryMediaModels(kind).find(item => item.model === model?.model && item.provider === model?.provider);
  if (!selected) throw new Error('所选文字输入媒体模型已不可用，请刷新；不会自动切换模型');
  const size = getAIGenerationDefaultSizeByType(`ai-${kind}`);
  const position = calcSafeSpawnPosNearNode(nodes, nodes[workspaceNodeId], size.width, size.height);
  return buildStoryMediaGenerationNode({ id: generateId(`ai-${kind}`), workspaceNodeId, episodeId, shot, kind, model: selected, ...size, ...position });
}
export function prepareStoryMediaResult({ nodes, workspaceNodeId, episodeId, shot, nodeId, index, expectedKey }) {
  const node = nodes[nodeId];
  const position = calcSafeSpawnPosNearNode(nodes, node || nodes[workspaceNodeId], 380, 280);
  const reference = node?.storyMediaReference ? assertStoryReferenceSource({ node, nodes, shot }) : null;
  const result = buildSourceMediaNodePayload(buildStoryMediaResultNode({ id: generateId('node'), node,
    context: { workspaceNodeId, episodeId, shotId: shot.id }, shot, index, expectedKey, ...position }));
  if (reference) result.storyMediaResult.referenceImage = { version: 1, slot: 'firstFrame', ...reference };
  return result;
}


export function prepareStoryMediaBatch({ nodes, workspaceNodeId, episodeId, shots, kind, model, batchId }) {
  if (!Array.isArray(shots) || !shots.length || shots.length > 6 || new Set(shots.map(shot => shot.id)).size !== shots.length) {
    throw new Error('每批请选择1–6个不重复的镜头');
  }
  const planned = { ...nodes }, result = [];
  for (const shot of shots) {
    const existing = Object.values(nodes).filter(node => {
      const source = node?.storyMediaSource;
      return source?.workspaceNodeId === workspaceNodeId && source.episodeId === episodeId && source.shotId === shot.id && source.kind === kind;
    });
    if (existing.length >= 6) throw new Error(`镜头 ${shot.id} 同类节点已达6个，请先整理旧节点`);
    const node = prepareStoryMediaGeneration({ nodes: planned, workspaceNodeId, episodeId, shot, kind, model });
    node.storyMediaBatch = { version: 1, batchId, state: 'held' };
    planned[node.id] = node; result.push(node);
  }
  return result;
}

export function getStoryReferenceVideoChoice() {
  try { return getStoryReferenceVideoModel(resolveModelExecution); } catch { return null; }
}
export function prepareStoryReferenceVideo({ nodes, workspaceNodeId, episodeId, shot }) {
  const model = getStoryReferenceVideoModel(resolveModelExecution);
  const size = getAIGenerationDefaultSizeByType('ai-video');
  const position = calcSafeSpawnPosNearNode(nodes, nodes[workspaceNodeId], size.width, size.height);
  return buildStoryReferenceVideoPlan({ id: generateId('ai-video'), edgeId: generateId('edge'), nodes,
    workspaceNodeId, episodeId, shot, model, ...size, ...position });
}