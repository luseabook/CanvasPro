import { readStoryClipImage, readStoryClipAudioSource, storyClipAudioOrigin, validateStoryClipAudio, storyClipAudioSummary } from './storyClipMedia.js';
import { normalizeStoryWorkspace } from './storyWorkspaceModel.js';
import { matchesStoryMediaSource, isStoryMediaSourceCurrent } from './storyMediaModel.js';
import { assertStoryReferenceSource } from './storyReferenceVideo.js';
import { normalizeLocalPath } from '../../utils/localMediaPath.js';
import { validateExportMediaPath } from '../nodeExport/nodeMediaExportModel.js';
import { normalizeMediaClipState, resolveMediaClipSourceKey, resolveMediaClipDurationSec } from '../../components/media-clip/mediaClipState.js';
import { MEDIA_CLIP_COMPACT_SIZE } from '../../services/mediaSizingPolicy.js';

export const STORY_CLIP_MAX_ITEMS = 60;
export const STORY_CLIP_MAX_SECONDS = 3600;
const safeId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,160}$/.test(value) && !['__proto__', 'constructor', 'prototype'].includes(value);
const ms = value => Math.round(value * 1000) / 1000;

export function readStoryClipItems({ nodes, workspaceNodeId, episode, shotIds, mediaKinds = {} }) {
  if (!episode || !Array.isArray(shotIds) || !shotIds.length || shotIds.length > STORY_CLIP_MAX_ITEMS ||
      new Set(shotIds).size !== shotIds.length) throw new Error('请选择1–60个不重复的镜头；不会静默截断');
  const selected = new Set(shotIds), shots = episode.shots.filter(shot => selected.has(shot.id));
  if (shots.length !== shotIds.length) throw new Error('所选镜头已缺失');
  return shots.map(shot => {
    const base = { shotId: shot.id, description: shot.description.slice(0, 160), plannedDuration: shot.duration };
    const kind = mediaKinds[shot.id] ?? 'video';
    const ref = shot.mediaRefs?.find(item => item.kind === kind);
    try {
      if (kind === 'image') return { ...base, ...readStoryClipImage({ nodes, workspaceNodeId, episode, shot }) };
      if (kind !== 'video') throw new Error('每镜必须显式选择视频或图片，不自动替换缺失素材');
      const node = nodes[ref?.nodeId], result = node?.storyMediaResult;
      const context = { workspaceNodeId, episodeId: episode.id, shotId: shot.id };
      if (node?.type !== 'source-video' || !matchesStoryMediaSource(result, context, node.id, 'video') ||
          !isStoryMediaSourceCurrent(result, shot)) throw new Error('缺少本镜当前提示词的已采纳本地视频');
      const localPath = result.localPath;
      validateExportMediaPath(localPath, 'video');
      if (!/\.(mp4|mov|webm|mkv|m4v|avi)$/i.test(localPath) || /[%?#]/.test(localPath)) throw new Error('初剪只支持本地MP4/MOV/WebM/MKV/M4V/AVI，路径不能含编码或查询片段');
      if (normalizeLocalPath(node.src) !== localPath || normalizeLocalPath(node.localPath) !== localPath ||
          resolveMediaClipSourceKey(node) !== localPath) throw new Error('已采纳视频路径或原剪辑实际输入已变化');
      if (node.isGenerating || node.videoProxyStatus === 'processing' || node.videoProxyStatus === 'waiting') throw new Error('素材仍在处理，请稍后刷新');
      if (typeof result.resultKey !== 'string' || !result.resultKey || result.resultKey.length > 4096) throw new Error('视频来源记录无效');
      if (result.referenceImage) assertStoryReferenceSource({ node, nodes, shot });
      const duration = Math.floor(resolveMediaClipDurationSec(node, 'video') * 1000) / 1000;
      if (!Number.isFinite(duration) || duration < 0.1 || duration > STORY_CLIP_MAX_SECONDS) throw new Error('素材时长未就绪或超过3600秒；请定位已采纳视频加载元数据后刷新');
      return { ...base, nodeId: node.id, localPath, resultKey: result.resultKey, promptText: result.promptText, duration,
        referenceImage: result.referenceImage ? { ...assertStoryReferenceSource({ node, nodes, shot }) } : null };
    } catch (error) { return { ...base, nodeId: ref?.nodeId || '', error: error.message }; }
  });
}
function origin(item) {
  return { shotId: item.shotId, nodeId: item.nodeId, localPath: item.localPath, resultKey: item.resultKey,
    promptText: item.promptText, duration: item.duration, referenceImage: item.referenceImage,
    ...(item.kind === 'image' ? { kind: 'image' } : {}) }; 
}
export function storyClipOrigins(items) { return JSON.stringify(items.map(origin)); }
export function validateStoryClipRanges(items, ranges) {
  if (!Array.isArray(ranges) || ranges.length !== items.length || !items.length || items.length > STORY_CLIP_MAX_ITEMS) throw new Error('初剪片段数量不符');
  let total = 0;
  const clips = items.map((item, index) => {
    if (item.error) throw new Error(`镜头 ${item.shotId}：${item.error}`);
    const range = ranges[index];
    if (range?.shotId !== item.shotId || typeof range.start !== 'number' || typeof range.end !== 'number' ||
        !Number.isFinite(range.start) || !Number.isFinite(range.end)) throw new Error('入出点必须是数字秒数并与镜头顺序一致');
    const start = ms(range.start), end = ms(range.end);
    const image = item.kind === 'image';
    if (start < 0 || end - start < 0.0999 || (image ? start !== 0 || end > STORY_CLIP_MAX_SECONDS : end > item.duration + 0.001)) {
      throw new Error(`镜头 ${item.shotId}：视频不能超出记录时长；图片入点固定0、保留0.1–3600秒`);
    }
    const timelineStartSec = total; total = ms(total + end - start);
    return { startSec: start, endSec: end, timelineStartSec, timelineEndSec: total };
  });
  if (total > STORY_CLIP_MAX_SECONDS) throw new Error('单次初剪合计不能超过3600秒');
  return { clips, total };
}
function mediaKindsFor(items) {
  return Object.fromEntries(items.map(item => [item.shotId, item.kind || 'video']));
}
function audioSelection(source, clip) {
  return source && { source: storyClipAudioOrigin(source), start: clip?.startSec, end: clip?.endSec,
    timelineStart: clip?.timelineStartSec, volume: clip?.volume, muted: clip?.muted };
}

export function buildStoryClipPlan({ id, edgeIds, nodes, workspaceNodeId, episode, items, ranges,
  audio = null, audioEdgeId = '', mediaVersion = 1, x = 0, y = 0 }) {
  const ids = [id, workspaceNodeId, episode?.id, ...edgeIds, ...(audio ? [audioEdgeId] : [])];
  const newIds = [id, ...edgeIds, ...(audio ? [audioEdgeId] : [])];
  if (!ids.every(safeId) || edgeIds.length !== items.length || new Set(newIds).size !== newIds.length || ![1, 2].includes(mediaVersion)) {
    throw new Error('初剪节点或连线ID无效');
  }
  const current = readStoryClipItems({ nodes, workspaceNodeId, episode, shotIds: items.map(item => item.shotId), mediaKinds: mediaKindsFor(items) });
  if (storyClipOrigins(current) !== storyClipOrigins(items)) throw new Error('预览后镜头顺序或媒体来源已变化，请重新预览');
  const { clips, total } = validateStoryClipRanges(current, ranges);
  const sound = validateStoryClipAudio(audio, total);
  if (sound && JSON.stringify(readStoryClipAudioSource(nodes, sound.source.nodeId)) !== JSON.stringify(sound.source)) {
    throw new Error('预览后音频来源或时长已变化，请重新选择');
  }
  const version = sound || current.some(item => item.kind === 'image') ? 2 : mediaVersion;
  const edges = current.map((item, index) => ({ id: edgeIds[index], sourceId: item.nodeId, targetId: id, createdAt: index + 1 }));
  if (sound) edges.push({ id: audioEdgeId, sourceId: sound.source.nodeId, targetId: id, createdAt: current.length + 1 });
  const sources = current.map((item, index) => ({ ...nodes[item.nodeId], __mediaClipEdgeId: edgeIds[index] }));
  const audioClips = sound ? [{ id: audioEdgeId, kind: 'audio', sourceId: sound.source.nodeId, sourceKey: sound.source.localPath,
    durationSec: sound.source.duration, startSec: sound.start, endSec: sound.end, timelineStartSec: sound.timelineStart,
    timelineEndSec: sound.timelineEnd, laneIndex: 0, volume: sound.volume, muted: sound.muted, disabled: false }] : [];
  const node = { id, type: 'media-clip', x, y, ...MEDIA_CLIP_COMPACT_SIZE, name: `镜头初剪 · ${episode.title.slice(0, 80)}`,
    storySequence: { version, nodeId: id, workspaceNodeId, episodeId: episode.id, episodeShotIds: episode.shots.map(shot => shot.id),
      items: current.map((item, index) => ({ ...origin(item), edgeId: edgeIds[index] })),
      ...(version === 2 ? { audio: sound ? { ...sound.source, edgeId: audioEdgeId } : null } : {}) } };
  node.mediaClip = normalizeMediaClipState({ mediaClip: { clips: current.map((item, index) => ({
    id: edgeIds[index], sourceId: item.nodeId, sourceKey: item.localPath, kind: item.kind || 'video', durationSec: item.duration,
    ...(item.kind === 'image' ? { storyImageDurationSec: clips[index].endSec } : {}), ...clips[index],
  })), audioClips } }, { videos: sources, audios: sound ? [{ ...nodes[sound.source.nodeId], __mediaClipEdgeId: audioEdgeId }] : [] });
  if (node.mediaClip.clips.length !== items.length || node.mediaClip.clips.some((clip, i) =>
    clip.startSec !== clips[i].startSec || clip.endSec !== clips[i].endSec) || node.mediaClip.audioClips.length !== audioClips.length || node.mediaClip.audioClips.some((clip, i) => Object.keys(audioClips[i]).some(key => clip[key] !== audioClips[i][key]))) {
    throw new Error('原剪辑规范化改变了范围或音轨，未建立节点');
  }
  return { node, edges, total };
}

// Synchronous preflight before any writes; no renderer invocation, disk save or rollback promise.
export function applyStoryClipPlan({ store, nodesContext, workspaceNodeId, baseSignature, draft, plan, commit }) {
  const state = store.getStateRaw(), nodes = state.nodes;
  if (nodes !== nodesContext || nodes[workspaceNodeId]?.type !== 'story-workspace' ||
      JSON.stringify(normalizeStoryWorkspace(nodes[workspaceNodeId].storyWorkspace)) !== baseSignature) throw new Error('工作室或画布已改变，未写入初剪');
  const workspace = normalizeStoryWorkspace(draft), node = plan?.node, source = node?.storySequence;
  if (node?.type !== 'media-clip' || ![1, 2].includes(source?.version) || source.nodeId !== node.id || source.workspaceNodeId !== workspaceNodeId) throw new Error('初剪来源无效');
  const episode = workspace.episodes.find(item => item.id === source.episodeId);
  const rebuilt = buildStoryClipPlan({ id: node.id, edgeIds: source.items.map(item => item.edgeId), nodes, workspaceNodeId, episode,
    items: source.items, ranges: node.mediaClip.clips.map((clip, index) => ({ shotId: source.items[index]?.shotId, start: clip.startSec, end: clip.endSec })),
    audio: audioSelection(source.audio, node.mediaClip.audioClips?.[0]), audioEdgeId: source.audio?.edgeId, mediaVersion: source.version, x: node.x, y: node.y });
  if (JSON.stringify(rebuilt.node.storySequence) !== JSON.stringify(source) || JSON.stringify(rebuilt.edges) !== JSON.stringify(plan.edges) || JSON.stringify(rebuilt.node.mediaClip) !== JSON.stringify(node.mediaClip)) throw new Error('初剪计划已变化，未写入');
  const ids = [node.id, ...plan.edges.map(edge => edge.id)];
  if (ids.some(id => nodes[id] || state.edges?.[id]) || new Set(ids).size !== ids.length || typeof store.addEdge !== 'function' || typeof store.batch !== 'function') throw new Error('初剪节点/连线ID冲突或接口不可用，未写入');
  store.batch(() => {
    store.addNode(rebuilt.node);
    for (const edge of rebuilt.edges) store.addEdge(edge);
    store.updateNodeData(workspaceNodeId, { storyWorkspace: workspace });
  });
  commit();
  return { workspace, signature: JSON.stringify(workspace), nodeId: node.id };
}

export function createStoryClipExportGuard({ store, nodeId, payload, expectedNodes, requireMarked = false }) {
  const nodesContext = store.getStateRaw().nodes;
  if (!nodesContext[nodeId]?.storySequence) {
    if (requireMarked) throw new Error('初剪原节点已离开当前画布或来源标签已缺失');
    return null;
  }
  if (expectedNodes !== undefined && expectedNodes !== nodesContext) throw new Error('初剪组件所属画布已改变，请重新打开原画布');
  const read = () => {
    const state = store.getStateRaw(), node = state.nodes[nodeId], source = node?.storySequence;
    if (state.nodes !== nodesContext || ![1, 2].includes(source?.version) || source.nodeId !== nodeId || node.type !== 'media-clip') throw new Error('初剪来源画布或节点已改变');
    const owner = state.nodes[source.workspaceNodeId];
    if (owner?.type !== 'story-workspace') throw new Error('来源工作室已不存在');
    const episode = owner.storyWorkspace?.episodes?.find(item => item.id === source.episodeId);
    if (!episode || JSON.stringify(episode.shots.map(shot => shot.id)) !== JSON.stringify(source.episodeShotIds)) throw new Error('本集镜头列表或顺序已变化，请重新预览建立初剪');
    if (source.version === 1 && (source.audio || source.items.some(item => item.kind && item.kind !== 'video'))) throw new Error('旧视频初剪不能静默升级为混合初剪');
    const items = readStoryClipItems({ nodes: state.nodes, workspaceNodeId: source.workspaceNodeId, episode,
      shotIds: source.items.map(item => item.shotId), mediaKinds: mediaKindsFor(source.items) });
    if (storyClipOrigins(items) !== storyClipOrigins(source.items)) throw new Error('镜头顺序、媒体来源、图片计划时长或首帧已变化，请重新建立初剪');
    const expectedEdges = [...source.items, ...(source.audio ? [source.audio] : [])];
    const edges = Object.values(state.edges || {}).filter(edge => edge.targetId === nodeId)
      .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0) || a.id.localeCompare(b.id));
    if (edges.length !== expectedEdges.length || expectedEdges.some((item, i) => edges[i].id !== item.edgeId || edges[i].sourceId !== item.nodeId)) throw new Error('初剪入边缺失、增加或顺序变化，未导出');
    const clips = node.mediaClip?.clips;
    if (!Array.isArray(clips) || clips.length !== items.length) throw new Error('不接受增删初剪片段');
    const ranges = clips.map((clip, index) => {
      const item = source.items[index];
      if (clip.id !== item.edgeId || clip.sourceId !== item.nodeId || clip.sourceKey !== item.localPath || clip.kind !== (item.kind || 'video') ||
          clip.muted || clip.disabled || (clip.volume !== undefined && clip.volume !== 1)) throw new Error('初剪片段顺序、来源或声音设置已变化');
      if (item.kind === 'image' && (!Number.isFinite(clip.storyImageDurationSec) || clip.storyImageDurationSec < 0.1 ||
          clip.storyImageDurationSec > 3600 || clip.durationSec !== clip.storyImageDurationSec || clip.endSec > clip.storyImageDurationSec)) {
        throw new Error('图片保留时长记录无效，请重新预览');
      }
      return { shotId: item.shotId, start: clip.startSec, end: clip.endSec };
    });
    const checked = validateStoryClipRanges(items, ranges);
    if (clips.some((clip, index) => clip.timelineStartSec !== checked.clips[index].timelineStartSec || clip.timelineEndSec !== checked.clips[index].timelineEndSec)) throw new Error('本批不接受时间线空隙、重叠或变速');
    const audioClips = node.mediaClip.audioClips || [];
    let audio = null;
    if (source.audio) {
      const current = readStoryClipAudioSource(state.nodes, source.audio.nodeId), clip = audioClips[0];
      if (JSON.stringify(current) !== JSON.stringify(storyClipAudioOrigin(source.audio))) throw new Error('已采纳音频来源或时长已改变');
      if (audioClips.length !== 1 || clip?.id !== source.audio.edgeId || clip.kind !== 'audio' || clip.sourceId !== current.nodeId ||
          clip.sourceKey !== current.localPath || clip.laneIndex !== 0 || clip.disabled || clip.durationSec !== current.duration ||
          node.mediaClip.tracks?.audio?.sourceKey !== current.localPath) throw new Error('只接受已采纳的单条音轨，不接受增删、换轨或禁用字段');
      audio = validateStoryClipAudio(audioSelection(current, clip), checked.total);
      if (clip.timelineEndSec !== audio.timelineEnd) throw new Error('音轨不得变速或伸缩');
    } else if (audioClips.length || node.mediaClip.tracks?.audio) throw new Error('未显式采纳独立音轨，不接受外接音轨');
    return { workspaceNodeId: source.workspaceNodeId, episodeId: source.episodeId, items: items.map(origin), ranges, total: checked.total,
      ...(source.version === 2 ? { mediaVersion: 2, audio } : {}) };
  };
  const approved = read(), signature = JSON.stringify(approved);
  const actual = payload?.timeline?.clips, audio = approved.audio;
  const actualVisual = actual?.filter(clip => clip.kind !== 'audio');
  if (payload?.outputType !== 'video' || !Array.isArray(actual) || actual.length !== approved.items.length + (audio ? 1 : 0) ||
      actualVisual.length !== approved.items.length || actualVisual.some((clip, i) =>
        clip.kind !== (approved.items[i].kind || 'video') || normalizeLocalPath(clip.sourceKey) !== approved.items[i].localPath ||
        clip.mediaStartSec !== approved.ranges[i].start || clip.mediaEndSec !== approved.ranges[i].end || clip.muted || clip.disabled || clip.volume !== 1 ||
        clip.timelineStartSec !== ms(approved.ranges.slice(0, i).reduce((sum, range) => sum + range.end - range.start, 0)) ||
        clip.timelineEndSec !== ms(approved.ranges.slice(0, i + 1).reduce((sum, range) => sum + range.end - range.start, 0)))) throw new Error('原剪辑实际导出内容与当前镜头初剪不符');
  if (audio) {
    const actualAudio = actual.filter(clip => clip.kind === 'audio');
    const clip = actualAudio[0];
    if (actualAudio.length !== 1 || normalizeLocalPath(clip.sourceKey) !== audio.source.localPath || clip.mediaStartSec !== audio.start ||
        clip.mediaEndSec !== audio.end || clip.timelineStartSec !== audio.timelineStart || clip.timelineEndSec !== audio.timelineEnd ||
        clip.volume !== audio.volume || clip.muted !== audio.muted || clip.disabled || clip.laneIndex !== 0) throw new Error('原剪辑实际音轨与采纳设置不符');
  }
  const args = { clips: approved.items.map((item, i) => ({ src: item.localPath, kind: item.kind || 'video', start: approved.ranges[i].start, end: approved.ranges[i].end })), duration: approved.total };
  if (approved.mediaVersion === 2) {
    args.mediaVersion = 2;
    args.audioClips = audio ? [{ kind: 'audio', src: audio.source.localPath, start: audio.start, end: audio.end,
      timelineStart: audio.timelineStart, timelineEnd: audio.timelineEnd, volume: audio.volume, muted: audio.muted }] : [];
  }
  const request = { outputType: 'video', signature: payload.signature, electronPayload: {
    kind: 'storySequenceExport', nodeId, src: approved.items[0].localPath, args } };
  return {
    request,
    confirmation: `渲染这 ${approved.items.length} 段镜头，共 ${approved.total} 秒？\n${approved.items.map((item, i) => `${i + 1}. ${item.kind === 'image' ? '静态图片' : '视频'} · ${item.shotId} · ${approved.ranges[i].start}–${approved.ranges[i].end}s · ${item.localPath}`).join('\n')}\n${storyClipAudioSummary(audio)}\n仅本地桌面渲染，不调用AI。按首个视频（全图片时首图）尺寸及原帧率策略统一规格，可能补黑边。有声/无声混排时给图片及无声段补静音；全无声时可无音轨。每次重新渲染新ClipVideo文件，不覆盖旧成片。关闭或超时不保证取消，请勿盲目重试。`,
    outputSource: { version: approved.mediaVersion || 1, clipNodeId: nodeId, ...approved },
    assertCurrent() { if (JSON.stringify(read()) !== signature) throw new Error('确认后画布、来源或剪辑范围已改变，未自动写回'); },
  };
}

export function validateStoryClipOutput(result) {
  const localPath = normalizeLocalPath(result?.localPath || result?.path);
  validateExportMediaPath(localPath, 'video');
  if (result?.success !== true || !Number.isFinite(result.videoDuration) || result.videoDuration <= 0) throw new Error('初剪返回缺少明确成功或本地视频信息，请核对本地任务；不自动重试');
  return localPath;
}