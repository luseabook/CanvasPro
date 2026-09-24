import { getStoryMediaModels } from './storyMediaCanvas.js';
import { buildStoryAssetGenerationNode, buildStoryAssetResultNode, storyAssetLabel } from './storyAssetMediaModel.js';
import { generateId } from '../../core/math.js';
import { calcSafeSpawnPosNearNode } from '../nodeSpawn.js';
import { getAIGenerationDefaultSizeByType, buildSourceMediaNodePayload } from '../../services/fileService.js';

export function prepareStoryAssetBatch({ nodes, workspaceNodeId, assetKind, assets, model, batchId }) {
  storyAssetLabel(assetKind);
  if (!Array.isArray(assets) || !assets.length || assets.length > 6 || new Set(assets.map(asset => asset.id)).size !== assets.length) throw new Error('请选择1–6项不重复资料');
  const selected = getStoryMediaModels('image').find(item => item.provider === model?.provider && item.model === model?.model);
  if (!selected) throw new Error('所选文字输入图片模型已不可用；不会自动换模型');
  const planned = { ...nodes }, additions = [], size = getAIGenerationDefaultSizeByType('ai-image');
  for (const asset of assets) {
    const count = Object.values(nodes).filter(node => node.storyAssetSource?.workspaceNodeId === workspaceNodeId &&
      node.storyAssetSource.assetKind === assetKind && node.storyAssetSource.assetId === asset.id).length;
    if (count >= 6) throw new Error(`${asset.name} 已有6个资料生成节点，请先核对旧结果；不会自动清理`);
    const position = calcSafeSpawnPosNearNode(planned, nodes[workspaceNodeId], size.width, size.height);
    const node = buildStoryAssetGenerationNode({ id: generateId('ai-image'), workspaceNodeId, assetKind, asset, model: selected, batchId, ...size, ...position });
    planned[node.id] = node; additions.push(node);
  }
  return additions;
}
export function prepareStoryAssetResult({ nodes, workspaceNodeId, assetKind, asset, nodeId, index, expectedKey }) {
  const position = calcSafeSpawnPosNearNode(nodes, nodes[nodeId] || nodes[workspaceNodeId], 380, 280);
  return buildSourceMediaNodePayload(buildStoryAssetResultNode({ id: generateId('node'), node: nodes[nodeId],
    context: { workspaceNodeId, assetKind, assetId: asset.id }, asset, index, expectedKey, ...position }));
}
