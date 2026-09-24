import { normalizeLocalPath } from '../../utils/localMediaPath.js';
import { resolveGenerationInputImageUrl } from '../../services/imageReferenceUrlService.js';
import { buildStoryMediaGenerationNode, matchesStoryMediaSource, isStoryMediaSourceCurrent, escapeStoryMediaPrompt } from './storyMediaModel.js';
import { validateExportMediaPath } from '../nodeExport/nodeMediaExportModel.js';

export const STORY_REFERENCE_VIDEO_MODEL = 'runninghub-model/seedance-2.0';
const MODE = 'image2video';
const MODE_FIELD = 'rh_seedance_2_mode';
const PARAM_DEFAULTS = { rh_seedance_2_model: 'fast', [MODE_FIELD]: MODE, duration: 5, resolution: '1080p',
  aspectRatio: '1:1', generateAudio: true, webSearch: false, realPersonMode: false, returnLastFrame: false };

// One audited native contract, not a claim that every image-capable video model has a first frame.
export function getStoryReferenceVideoModel(resolveExecution) {
  const { modelManifest: model, executionManifest: execution } = resolveExecution(STORY_REFERENCE_VIDEO_MODEL, { providerHint: 'runninghub' });
  const slot = model?.inputSlots?.fixedSlots?.find(item => item.id === 'firstFrame');
  if ([model, execution].some(item => item?.provider !== 'runninghub' || item.kind !== 'video' || item.adapterType !== 'modelApi') ||
      model.modelId !== STORY_REFERENCE_VIDEO_MODEL || model.outputType !== 'video' || slot?.kind !== 'image' ||
      slot.showWhen?.field !== MODE_FIELD || !slot.showWhen.values?.includes(MODE) ||
      execution.extensions?.bodyResolver !== 'runninghubSeedance2Video' ||
      execution.extensions?.endpointResolver !== 'runninghubSeedance2VideoEndpoint') {
    throw new Error('本机 Seedance 2.0 modelApi 首帧契约不可用；不会自动换模型');
  }
  return { provider: 'runninghub', model: STORY_REFERENCE_VIDEO_MODEL, label: 'RunningHub Seedance 2.0 · 图生视频 / firstFrame' };
}

export function readStoryAcceptedImage({ nodes, context, shot }) {
  const refs = (shot?.mediaRefs || []).filter(ref => ref.kind === 'image');
  const image = refs.length === 1 && nodes[refs[0].nodeId];
  const result = image?.storyMediaResult;
  if (image?.type !== 'source-image' || !matchesStoryMediaSource(result, context, image.id, 'image') ||
      !isStoryMediaSourceCurrent(result, shot) || typeof result.resultKey !== 'string' || !result.resultKey || result.resultKey.length > 4096) {
    throw new Error('请先采纳本镜当前图片提示词的独立本地图片结果');
  }
  const localPath = result.localPath;
  validateExportMediaPath(localPath, 'image');
  if (['src', 'localPath', 'originalLocalPath'].some(key => normalizeLocalPath(image[key]) !== localPath) ||
      normalizeLocalPath(resolveGenerationInputImageUrl(image)) !== localPath) {
    throw new Error('已采纳图片的原图路径或实际输入已变化，请重新采纳');
  }
  return { imageNodeId: image.id, localPath, resultKey: result.resultKey };
}

export function assertStoryReferenceSource({ node, nodes, shot }) {
  const reference = node.storyMediaReference || node.storyMediaResult?.referenceImage;
  const source = node.storyMediaSource || node.storyMediaResult;
  if (reference?.version !== 1 || reference.slot !== 'firstFrame' || !source) throw new Error('首帧来源记录无效');
  const current = readStoryAcceptedImage({ nodes, shot, context: source });
  for (const key of ['imageNodeId', 'localPath', 'resultKey']) {
    if (current[key] !== reference[key]) throw new Error('本镜已采纳首帧已更换；请重新建立视频任务，不会串联旧结果');
  }
  return current;
}

export function buildStoryReferenceVideoPlan({ id, edgeId, nodes, workspaceNodeId, episodeId, shot, model, ...geometry }) {
  if (model?.provider !== 'runninghub' || model.model !== STORY_REFERENCE_VIDEO_MODEL) throw new Error('请选择已核实的首帧模型');
  const reference = readStoryAcceptedImage({ nodes, shot, context: { workspaceNodeId, episodeId, shotId: shot.id } });
  const node = buildStoryMediaGenerationNode({ id, workspaceNodeId, episodeId, shot, kind: 'video', model, ...geometry });
  node.generationParams = { [MODE_FIELD]: MODE };
  node.storyMediaReference = { version: 1, slot: 'firstFrame', ...reference };
  return { node, edge: { id: edgeId, sourceId: reference.imageNodeId, targetId: id, refSlot: 'firstFrame' } };
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return value !== undefined && value !== null && value !== '' && value !== false;
}
const EXTRA_INPUTS = ['promptAssetInputRefs', 'assetInputRefs', 'providerAssetRefs', 'inputUrls', 'inputUrlsBySlot',
  'images', 'videos', 'audios', 'firstFrameUrl', 'lastFrameUrl', 'imageUrl', 'videoUrl', 'audioUrl'];

function canonicalPromptHtml(value) {
  return String(value).replace(/&quot;/g, '"').replace(/&#(?:39|x27);/gi, "'").replace(/<br\s*\/?>/gi, '<br>');
}

function assertReferenceNode(node, nodes, edges, shot, resolveExecution, promptHtml) {
  getStoryReferenceVideoModel(resolveExecution);
  const source = node?.storyMediaSource;
  if (node?.type !== 'ai-video' || node.provider !== 'runninghub' || node.model !== STORY_REFERENCE_VIDEO_MODEL ||
      node.storyMediaBatch || !matchesStoryMediaSource(source, source || {}, node.id, 'video') || !isStoryMediaSourceCurrent(source, shot)) {
    throw new Error('首帧视频的模型、镜头来源或提示词已变化，请重新建立任务');
  }
  const reference = assertStoryReferenceSource({ node, nodes, shot });
  const expectedPrompt = escapeStoryMediaPrompt(source.promptText);
  if (canonicalPromptHtml(node.prompt) !== canonicalPromptHtml(expectedPrompt) ||
      (promptHtml !== undefined && canonicalPromptHtml(promptHtml) !== canonicalPromptHtml(expectedPrompt))) {
    throw new Error('原节点提示词已改变；请在工作室修改并重新建立任务（不接受素材标签或预设覆盖）');
  }
  if (node.generationParams?.[MODE_FIELD] !== MODE || (node[MODE_FIELD] && node[MODE_FIELD] !== MODE)) {
    throw new Error('首帧任务必须保留图生视频模式');
  }
  // Old generated results are not inputs in this model; do not block explicit manual regeneration.
  for (const key of EXTRA_INPUTS.filter(key => !['images', 'videos', 'videoUrl'].includes(key))) {
    if (hasValue(node[key])) throw new Error('首帧任务含额外输入，请移除或重新建立任务');
  }
  if (edges.length !== 1 || edges[0].sourceId !== reference.imageNodeId || edges[0].targetId !== node.id || edges[0].refSlot !== 'firstFrame') {
    throw new Error('首帧连线已缺失、替换或多出输入；不会发送');
  }
  return reference;
}

// Store/DOM/config awaits can outlive a canvas or an accepted result. Keep this comparison only in memory.
export function createStoryReferenceVideoGuard({ store, nodeId, resolveExecution, getPromptHtml }) {
  const nodesContext = store.getStateRaw().nodes;
  if (!nodesContext[nodeId]?.storyMediaReference) return null; // Ordinary native nodes unchanged.
  const read = () => {
    const nodes = store.getStateRaw().nodes, node = nodes[nodeId];
    if (nodes !== nodesContext || !node?.storyMediaReference) throw new Error('首帧来源画布或节点已改变');
    const source = node.storyMediaSource, workspace = nodes[source?.workspaceNodeId];
    if (workspace?.type !== 'story-workspace') throw new Error('来源工作室已不存在');
    const shot = workspace.storyWorkspace?.episodes?.find(item => item.id === source.episodeId)?.shots?.find(item => item.id === source.shotId);
    if (!shot) throw new Error('来源镜头已不存在');
    const reference = assertReferenceNode(node, nodes, store.getIncomingEdges(nodeId), shot, resolveExecution, getPromptHtml?.());
    // Original native seed randomization remains supported. No credential, service URL or whole-node snapshot.
    const parameters = Object.fromEntries(Object.entries(PARAM_DEFAULTS).map(([key, fallback]) =>
      [key, node.generationParams?.[key] ?? node[key] ?? fallback]));
    return { reference, source, parameters, prompt: node.prompt };
  };
  const approved = read(), signature = JSON.stringify(approved);
  let sent = false;
  return {
    reference: { ...approved.reference },
    confirmation: `发送本镜已采纳图片作为首帧？\n${approved.reference.imageNodeId}\n${approved.reference.localPath}\nRunningHub Seedance 2.0（图生视频）\n参数：${JSON.stringify(approved.parameters)}\n图片将经原媒体上传/厂商链路发送，可能计费。请确认图片使用权及原节点参数/价格；这里只确认本次调用，不授权自动重试。停止、超时或关闭不保证取消或不计费。`,
    assertCurrent(payload) {
      if (JSON.stringify(read()) !== signature) throw new Error('确认后首帧来源、提示词或参数已改变，请重新核对');
      if (payload) assertStoryReferencePayload(payload, approved);
    },
    beforeSend(payload) {
      this.assertCurrent(payload);
      if (sent) throw new Error('本次首帧确认已用于一次原生成调用，不自动重试');
      sent = true;
    },
  };
}

function assertStoryReferencePayload(payload, approved) {
  const samePath = value => typeof value === 'string' && normalizeLocalPath(value) === approved.reference.localPath;
  if (payload.provider !== 'runninghub' || payload.model !== STORY_REFERENCE_VIDEO_MODEL ||
      payload.generationParams?.[MODE_FIELD] !== MODE || payload.prompt !== approved.source.promptText.replace(/\r\n?/g, '\n')) {
    throw new Error('原请求的模型、模式或提示词与首帧确认不符');
  }
  for (const [key, fallback] of Object.entries(PARAM_DEFAULTS)) {
    if ((payload.generationParams?.[key] ?? payload[key] ?? fallback) !== approved.parameters[key]) throw new Error('实际请求参数与确认不符；请在原节点选择明确参数（含固定比例）后重新确认');
  }
  const slots = payload.inputUrlsBySlot;
  if (!slots || Object.keys(slots).length !== 1 || !samePath(slots.firstFrame) ||
      !Array.isArray(payload.images) || !payload.images.length || !payload.images.every(samePath) ||
      !Array.isArray(payload.inputUrls) || !payload.inputUrls.every(samePath)) throw new Error('实际请求未只使用已确认的本地首帧');
  for (const key of ['assetInputRefs', 'providerAssetRefs', 'videos', 'audios', 'lastFrameUrl', 'videoUrl', 'audioUrl']) {
    if (hasValue(payload[key])) throw new Error('实际请求含额外媒体输入，未发送');
  }
}