import { assertStoryAssetAddition, assertStoryAssetReferenceChanges } from './storyAssetMediaModel.js';
import { assertStoryReferenceSource } from './storyReferenceVideo.js';
import { normalizeStoryWorkspace } from './storyWorkspaceModel.js';

// Synchronous preflight before any store mutation. Not a disk save or a cross-store transaction.
export function applyStoryWorkspaceDraft({ store, commit, nodeId, nodesContext, baseSignature, draft, additionalNodes = [], additionalEdges = [] }) {
  const nodes = store.getStateRaw().nodes;
  if (nodes !== nodesContext || nodes[nodeId]?.type !== 'story-workspace') throw new Error('来源工作室或画布已改变，未写入');
  const previous = normalizeStoryWorkspace(nodes[nodeId].storyWorkspace);
  if (JSON.stringify(previous) !== baseSignature) throw new Error('项目中的工作室已被其他操作修改。请先导出草稿，再重载项目；不会覆盖新数据。');
  const value = normalizeStoryWorkspace(draft), signature = JSON.stringify(value), ids = new Set();
  if (!Array.isArray(additionalNodes) || additionalNodes.length > 6) throw new Error('每次最多建立6个媒体节点');
  if (additionalNodes.length > 1) {
    const batchId = additionalNodes[0]?.storyMediaBatch?.batchId;
    if (!batchId || additionalNodes.some(node => !['ai-image', 'ai-video'].includes(node?.type) ||
        node.storyMediaBatch?.version !== 1 || node.storyMediaBatch.batchId !== batchId || node.storyMediaBatch.state !== 'held')) {
      throw new Error('多个新节点必须属于同一个未发送媒体批次');
    }
  }
  const assetNodes = additionalNodes.filter(node => node?.storyAssetSource || node?.storyAssetResult);
  if (assetNodes.length && (assetNodes.length !== additionalNodes.length || additionalEdges.length || typeof store.batch !== 'function' ||
      new Set(assetNodes.map(node => (node.storyAssetSource || node.storyAssetResult).assetKind)).size !== 1 ||
      new Set(assetNodes.map(node => (node.storyAssetSource || node.storyAssetResult).assetId)).size !== assetNodes.length)) {
    throw new Error('资料批次不可混入镜头/连线或重复资料，且需要原batch写入接口');
  }
  for (const node of additionalNodes) {
    if (!node?.id || nodes[node.id] || store.getStateRaw().edges?.[node.id] || ids.has(node.id)) throw new Error('新媒体节点 ID 冲突；未写入');
    if (!['ai-image', 'ai-video', 'source-image', 'source-video'].includes(node.type) ||
        (node.storyMediaSource || node.storyMediaResult || node.storyAssetSource || node.storyAssetResult)?.workspaceNodeId !== nodeId) throw new Error('新媒体节点来源不符；未写入');
    if (node.storyAssetSource || node.storyAssetResult) assertStoryAssetAddition({ node, workspace: value, workspaceNodeId: nodeId, nodes });
    ids.add(node.id);
  }
  const plannedNodes = { ...nodes, ...Object.fromEntries(additionalNodes.map(node => [node.id, node])) };
  assertStoryAssetReferenceChanges({ previous, workspace: value, workspaceNodeId: nodeId, nodes: plannedNodes });
  // This API only accepts one explicit first-frame plan, never arbitrary graph edits.
  const referenced = additionalNodes.filter(node => node.storyMediaReference);
  if (!Array.isArray(additionalEdges) || additionalEdges.length > 1 || referenced.length !== additionalEdges.length) throw new Error('首帧节点和连线必须一起创建');
  for (const edge of additionalEdges) {
    const target = referenced[0], source = target.storyMediaSource;
    const shot = value.episodes.find(item => item.id === source.episodeId)?.shots.find(item => item.id === source.shotId);
    if (additionalNodes.length !== 1 || target.type !== 'ai-video' || target.storyMediaBatch || !shot ||
        !/^[a-zA-Z0-9_-]{1,160}$/.test(edge.id) || store.getStateRaw().edges?.[edge.id] || nodes[edge.id] || ids.has(edge.id) ||
        typeof store.addEdge !== 'function' || edge.targetId !== target.id || edge.sourceId !== target.storyMediaReference.imageNodeId ||
        edge.refSlot !== 'firstFrame') throw new Error('首帧连线冲突或来源不符；未写入');
    assertStoryReferenceSource({ node: target, nodes, shot });
  }
  if (signature !== baseSignature || additionalNodes.length) {
    const write = () => {
      for (const node of additionalNodes) store.addNode(node);
      for (const edge of additionalEdges) store.addEdge({ id: edge.id, sourceId: edge.sourceId, targetId: edge.targetId, refSlot: edge.refSlot });
      store.updateNodeData(nodeId, { storyWorkspace: value });
    };
    if (assetNodes.length) store.batch(write); else write();
    commit();
  }
  return { workspace: value, signature };
}
