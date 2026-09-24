import { readStoryAcceptedImage } from './storyReferenceVideo.js';
import { normalizeLocalPath } from '../../utils/localMediaPath.js';
import { validateExportMediaPath } from '../nodeExport/nodeMediaExportModel.js';
import { resolveMediaClipSourceKey, resolveMediaClipDurationSec } from '../../components/media-clip/mediaClipState.js';

const EXTENSIONS = { image: /\.(png|jpe?g|webp|bmp)$/i, audio: /\.(mp3|wav|m4a|aac|flac|ogg)$/i };
const milliseconds = value => Math.round(value * 1000) / 1000;

export function assertStoryClipMediaPath(localPath, kind) {
  validateExportMediaPath(localPath, kind);
  if (!EXTENSIONS[kind]?.test(localPath) || /[%?#]/.test(localPath)) {
    throw new Error(kind === 'image' ? '图片初剪只接受本地静态PNG/JPEG/WebP/BMP；不接受编码或查询片段路径' :
      '独立音轨只接受本地MP3/WAV/M4A/AAC/FLAC/OGG；不接受编码或查询片段路径');
  }
}

export function readStoryClipImage({ nodes, workspaceNodeId, episode, shot }) {
  const accepted = readStoryAcceptedImage({ nodes, shot, context: { workspaceNodeId, episodeId: episode.id, shotId: shot.id } });
  const node = nodes[accepted.imageNodeId];
  assertStoryClipMediaPath(accepted.localPath, 'image');
  if (node.isGenerating || resolveMediaClipSourceKey(node) !== accepted.localPath) throw new Error('图片仍在处理或原剪辑输入已改变');
  if (typeof shot.duration !== 'number' || !Number.isFinite(shot.duration) || shot.duration < 0.1 || shot.duration > 3600) {
    throw new Error('图片默认保留时长需来自0.1–3600秒的分镜计划，请先修正计划');
  }
  return { kind: 'image', nodeId: node.id, localPath: accepted.localPath, resultKey: accepted.resultKey,
    promptText: node.storyMediaResult.promptText, duration: milliseconds(shot.duration), referenceImage: null };
}

// A source-audio is an already localized/imported/adopted canvas asset, never an AI request node.
// The selection explicitly adopts this asset into one sequence, not into every shot's mediaRefs.
export function readStoryClipAudioSource(nodes, nodeId) {
  const node = nodes[nodeId];
  if (!node || node.id !== nodeId || node.type !== 'source-audio' || node.isGenerating || node.isRecoveringTask) {
    throw new Error('请选择当前画布已落地的独立音频素材；生成中或AI音频节点不能直接作为音轨');
  }
  const localPath = node.localPath;
  assertStoryClipMediaPath(localPath, 'audio');
  if (normalizeLocalPath(node.src) !== localPath || resolveMediaClipSourceKey(node) !== localPath ||
      ['audioLocalPath', 'audioUrl'].some(key => node[key] && normalizeLocalPath(node[key]) !== localPath)) {
    throw new Error('音频原路径或实际输入已改变，请刷新素材后重新选择');
  }
  const duration = Math.floor(resolveMediaClipDurationSec(node, 'audio') * 1000) / 1000;
  if (!Number.isFinite(duration) || duration < 0.1 || duration > 3600) throw new Error('音频记录时长未就绪或超过3600秒，请先加载元数据');
  return { nodeId, localPath, duration };
}

export function listStoryClipAudioSources(nodes) {
  return Object.values(nodes).filter(node => node?.type === 'source-audio').map(node => {
    const label = String(node.name || node.id).slice(0, 160);
    try { return { ...readStoryClipAudioSource(nodes, node.id), label }; }
    catch (error) { return { nodeId: node.id, label, error: error.message }; }
  });
}

export function storyClipAudioOrigin(source) {
  return { nodeId: source.nodeId, localPath: source.localPath, duration: source.duration };
}

export function validateStoryClipAudio(selection, total) {
  if (selection == null) return null;
  if (Array.isArray(selection) || !selection.source || !Number.isFinite(total) || total < 0.1 || total > 3600) {
    throw new Error('只能显式采纳一条独立音轨');
  }
  const source = storyClipAudioOrigin(selection.source);
  assertStoryClipMediaPath(source.localPath, 'audio');
  if (typeof source.nodeId !== 'string' || !source.nodeId || !Number.isFinite(source.duration) || source.duration < 0.1 || source.duration > 3600 ||
      !['start', 'end', 'timelineStart', 'volume'].every(key => typeof selection[key] === 'number' && Number.isFinite(selection[key])) ||
      typeof selection.muted !== 'boolean') throw new Error('音轨来源、入出点、起点、音量或静音字段无效');
  const start = milliseconds(selection.start), end = milliseconds(selection.end), timelineStart = milliseconds(selection.timelineStart);
  const timelineEnd = milliseconds(timelineStart + end - start);
  if (start < 0 || end - start < 0.0999 || end > source.duration + 0.001 || timelineStart < 0 || timelineEnd > total + 0.001 ||
      selection.volume < 0 || selection.volume > 1) throw new Error('音轨须至少0.1秒、不超出素材与成片，起点非负，音量0–1；不会自动裁切或循环');
  return { source, start, end, timelineStart, timelineEnd, volume: selection.volume, muted: selection.muted };
}

export function storyClipAudioSummary(audio) {
  if (!audio) return '不添加独立音轨；视频保留原声，图片没有音轨。';
  return `单音轨：${audio.source.localPath}\n素材${audio.start}–${audio.end}秒；成片起点${audio.timelineStart}秒；音量${audio.volume}；${audio.muted ? '静音' : '非静音'}。\n视频原声保留，单音轨沿原渲染器叠加；不自动对齐、循环、闪避或调低原声，叠加可能削波。`;
}
