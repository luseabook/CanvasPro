import { createStableSignature } from '../../utils/stableSignature.js';
import { escapeStoryMediaPrompt, matchesStoryMediaSource, isStoryMediaSourceCurrent, readStoryMediaTask } from './storyMediaModel.js';

const COSMETIC = new Set(['x', 'y', 'width', 'height', 'name', 'label', 'needsAutoResize', 'storyMediaBatch']);
function guardSignature(node) {
  const data = {};
  for (const key of Object.keys(node)) if (!COSMETIC.has(key)) data[key] = node[key];
  const signature = createStableSignature(data);
  if (signature.length > 256 * 1024) throw new Error('节点数据过大，请在原节点人工生成');
  return signature; // Memory-only comparison; never exported, persisted or sent as a request.
}
function idleStatus(status = {}) {
  return !status.isGenerating && !status.taskId && ['', 'idle'].includes(String(status.jobStatus || ''));
}
function assertUnused(node, batchId) {
  if (node?.storyMediaBatch?.version !== 1 || node.storyMediaBatch.batchId !== batchId || node.storyMediaBatch.state !== 'held') {
    throw new Error('该节点已有批次尝试或来源不符；不会自动重发');
  }
  if (!idleStatus(node) || ['rhTaskId', 'asyncTaskId', 'dreaminaSubmitId', 'dreaminaTaskId', 'generationStartTime', 'generationStartedAt'].some(key => node[key])) {
    throw new Error('原节点已有执行/恢复记录，请人工核对');
  }
  if (['rhTaskStatus', 'asyncTaskStatus', 'dreaminaTaskStatus'].some(key => node[key] && node[key] !== 'idle') ||
      node.rhRecovering || node.asyncRecovering || node.dreaminaRecovering) throw new Error('节点带有历史任务状态，请人工核对');
  if (node.images?.length || node.videos?.length || node.localPath || node.imageUrl || node.videoUrl || node.sourceUrl) {
    throw new Error('原节点已有媒体结果，不会通过批次重新生成');
  }
}
function storedParameters(node) {
  const values = {};
  for (const key of ['aspectRatio', 'imageSize', 'resolution', 'duration', 'mode', 'batchSize', 'n']) {
    const value = node.generationParams?.[key] ?? node[key];
    if (['string', 'number', 'boolean'].includes(typeof value)) values[key] = String(value).slice(0, 160);
  }
  return values;
}

export function createStoryMediaBatchRuntime({ store, registry, renderer, getModels, commit, items, batchId,
  workspaceNodeId, episodeId, getShot, assertCurrent, sourcePolicy = null, tick = () => new Promise(resolve => setTimeout(resolve, 50)), onReview = () => {} }) {
  if (!Array.isArray(items) || !items.length || items.length > 6 || new Set(items.map(item => item.nodeId)).size !== items.length) throw new Error('批次节点数量无效');
  if (sourcePolicy && (typeof sourcePolicy.validate !== 'function' || typeof sourcePolicy.readTask !== 'function')) throw new Error('资料批次来源适配不完整');
  const nodesContext = store.getStateRaw().nodes;
  function promptFor(item, node) {
    if (sourcePolicy) return sourcePolicy.validate(item, node);
    const shot = getShot(item.shotId);
    if (!shot || !matchesStoryMediaSource(node?.storyMediaSource, { workspaceNodeId, episodeId, shotId: item.shotId }, item.nodeId, item.kind) ||
        node.type !== `ai-${item.kind}` || !isStoryMediaSourceCurrent(node.storyMediaSource, shot)) throw new Error('镜头来源或提示词已改变');
    return node.storyMediaSource.promptText;
  }
  function nodeFor(item) {
    assertCurrent();
    if (store.getStateRaw().nodes !== nodesContext) throw new Error('原画布已切换');
    const node = nodesContext[item.nodeId], prompt = promptFor(item, node);
    if (typeof prompt !== 'string' || !prompt || prompt.length > 20000 || node.prompt !== escapeStoryMediaPrompt(prompt)) throw new Error('节点提示词已修改；请回来源重建批次或使用原节点人工生成');
    if (store.getIncomingEdges(item.nodeId).length || node.assetInputRefs?.length || node.promptAssetInputRefs?.length || node.fixedInputRefs?.length) {
      throw new Error('批次仅支持显式选择的文字，不自动发送新增连线或媒体引用');
    }
    if (!getModels(item.kind).some(model => model.provider === node.provider && model.model === node.model)) throw new Error('原模型不可用，不会自动换模型');
    return node;
  }
  return async function prepare(isAllowed) {
    if (!renderer?.pinNode || !renderer?.unpinNode || !renderer?.flushNodes) throw new Error('原节点挂载服务不可用，请使用原节点人工生成');
    const pins = [], entries = new Map();
    const reason = `story-media-batch:${batchId}`;
    function release() {
      for (const id of pins.splice(0)) {
        try { renderer.unpinNode(id, reason); } catch { /* One stale renderer must not prevent the other releases. */ }
      }
    }
    try {
      for (const item of items) { assertUnused(nodeFor(item), batchId); renderer.pinNode(item.nodeId, reason); pins.push(item.nodeId); }
      const ids = items.map(item => item.nodeId);
      for (let attempt = 0; attempt < 40; attempt++) {
        if (!isAllowed()) throw new Error('准备已停止');
        assertCurrent(); renderer.flushNodes(ids);
        if (ids.every(id => typeof registry.get(id)?.runGeneration === 'function' && typeof registry.get(id)?.getGenerationStatus === 'function')) break;
        await tick();
      }
      await tick(); // Allow native default controls/state to settle before recording the guard.
      if (!isAllowed()) throw new Error('准备已停止');
      for (const item of items) {
        const node = nodeFor(item), runtime = registry.get(item.nodeId);
        assertUnused(node, batchId);
        if (typeof runtime?.runGeneration !== 'function' || typeof runtime?.getGenerationStatus !== 'function') throw new Error('原节点未完成挂载，尚未调用生成');
        if (!idleStatus(runtime.getGenerationStatus())) throw new Error('原节点运行时已有任务，尚未调用生成');
        entries.set(item.nodeId, { item, runtime, signature: guardSignature(node), invoked: false });
      }
      onReview(items.map(item => { const node = nodesContext[item.nodeId]; return { nodeId: item.nodeId, kind: item.kind,
        model: node.model, provider: node.provider, prompt: promptFor(item, node), parameters: storedParameters(node) }; }));
      function entryFor(id) { const entry = entries.get(id); if (!entry) throw new Error('节点不属于此批次'); return entry; }
      function verify(id, marked = false) {
        const entry = entryFor(id), node = nodeFor(entry.item);
        if (entry.invoked) throw new Error('本项已调用过原生成入口');
        if (!marked) assertUnused(node, batchId);
        else if (node.storyMediaBatch?.state !== 'attempted' || node.storyMediaBatch.batchId !== batchId) throw new Error('尝试标记已改变');
        if (registry.get(id) !== entry.runtime || !idleStatus(entry.runtime.getGenerationStatus()) || guardSignature(node) !== entry.signature) {
          throw new Error('节点参数或运行时已改变，请核对后使用原节点人工生成');
        }
        return entry;
      }
      return {
        release,
        verify,
        assertNoLocalRunning() {
          for (const entry of entries.values()) {
            if (!entry.invoked) continue;
            const status = entry.runtime.getGenerationStatus(), node = nodesContext[entry.item.nodeId];
            if (status.isGenerating || node?.isGenerating || ['pending', 'running', 'queued', 'processing'].includes(status.jobStatus) ||
                ['pending', 'running', 'queued', 'processing'].includes(node?.jobStatus)) throw new Error('上一项原节点仍在运行，不能继续发送');
          }
        },
        markAttempt(id) {
          verify(id);
          store.updateNodeData(id, { storyMediaBatch: { version: 1, batchId, state: 'attempted', attemptedAt: Date.now() } });
          commit(); // Canvas history only, not a disk-save acknowledgement.
        },
        invoke(id) {
          const entry = verify(id, true); entry.invoked = true;
          return entry.runtime.runGeneration({});
        },
        inspect(id) {
          assertCurrent();
          if (store.getStateRaw().nodes !== nodesContext) throw new Error('原画布已切换');
          const entry = entryFor(id), node = nodesContext[id];
          const task = sourcePolicy ? sourcePolicy.readTask(entry.item, node) :
            readStoryMediaTask(node, { workspaceNodeId, episodeId, shotId: entry.item.shotId }, getShot(entry.item.shotId));
          if (!task?.current || !Number.isFinite(node?.generationStartTime) || node.generationStartTime <= 0 || node.isGenerating || node.jobStatus !== 'success') {
            return { state: 'unknown', message: '没有确认本次成功结束；后续已暂停，请检查原节点/厂商记录' };
          }
          if (!task.results.length || task.rejectedCount) return { state: 'attention', message: '部分结果失败或无本地原媒体；后续已暂停，请在原节点核对' };
          return { state: 'succeeded', message: `${task.results.length} 个本地结果待人工采纳；尚未关联${sourcePolicy?.targetLabel || '镜头'}或确认磁盘保存` };
        },
      };
    } catch (error) { release(); throw error; }
  };
}
