import { normalizeMediaExportItems, safeExportName } from '../nodeExport/nodeMediaExportModel.js';

export const TIMELINE_EXPORT_LIMITS = Object.freeze({ clips: 32, seconds: 1800 });
export class TimelineExportError extends Error {}
export function timelineFail(message) { throw new TimelineExportError(message); }

export function normalizeTimelineRequest(payload) {
  if (!Array.isArray(payload?.clips) || !payload.clips.length || payload.clips.length > TIMELINE_EXPORT_LIMITS.clips) {
    timelineFail('请选择 1–32 个本地视频节点');
  }
  if (typeof payload.includeAudio !== 'boolean') timelineFail('必须明确选择保留原音轨或静音');
  const items = normalizeMediaExportItems({ items: payload.clips });
  const clips = items.map((item, index) => {
    if (item.kind !== 'video') timelineFail('本批时间线仅支持视频，不能静默忽略其他媒体');
    const raw = payload.clips[index];
    const startSec = raw.startSec;
    const endSec = raw.endSec === null ? null : raw.endSec;
    if (typeof startSec !== 'number' || !Number.isFinite(startSec) || startSec < 0 || startSec >= TIMELINE_EXPORT_LIMITS.seconds ||
        (endSec !== null && (typeof endSec !== 'number' || !Number.isFinite(endSec) || endSec <= startSec || endSec > TIMELINE_EXPORT_LIMITS.seconds))) {
      timelineFail(`第 ${index + 1} 段入出点无效（秒；出点可留空）`);
    }
    return { ...item, startSec, endSec };
  });
  return { title: safeExportName(payload.title || 'CanvasPro 时间线'), includeAudio: payload.includeAudio, clips };
}

const RATES = [
  [24, 1, 24, false], [25, 1, 25, false], [30, 1, 30, false], [50, 1, 50, false], [60, 1, 60, false],
  [24000, 1001, 24, true], [30000, 1001, 30, true], [60000, 1001, 60, true],
];
function ratio(value) {
  if (typeof value !== 'string' || !/^\d+\/\d+$/.test(value)) return NaN;
  const [n, d] = value.split('/').map(Number); return d > 0 ? n / d : NaN;
}
export function parseTimelineProbe(probe, includeAudio) {
  const videos = probe?.streams?.filter(stream => stream.codec_type === 'video') || [];
  const audios = probe?.streams?.filter(stream => stream.codec_type === 'audio') || [];
  if (videos.length !== 1) timelineFail('必须恰好有一个视频流；不支持封面附加流或多视角视频');
  const video = videos[0], fps = ratio(video.avg_frame_rate), nominal = ratio(video.r_frame_rate);
  const match = RATES.find(([n, d]) => Math.abs(fps - n / d) < 0.00001);
  if (!match || !Number.isFinite(nominal) || Math.abs(fps - nominal) > 0.00001) timelineFail('不支持此帧率或疑似可变帧率；请先用原剪辑流程转成恒定帧率');
  const [numerator, denominator, timebase, ntsc] = match;
  const width = Number(video.width), height = Number(video.height), frames = Number(video.nb_frames);
  const duration = Number(video.duration);
  if (![width, height, frames].every(Number.isSafeInteger) || width < 1 || height < 1 || width > 8192 || height > 8192 ||
      frames < 1 || !Number.isFinite(duration) || duration <= 0 || duration > TIMELINE_EXPORT_LIMITS.seconds ||
      Math.abs(frames / fps - duration) > 1 / fps + 0.001) timelineFail('无法可靠读取视频帧数/时长，或源视频超过30分钟/8192像素');
  const rotations = [video.tags?.rotate, ...(video.side_data_list || []).map(data => data.rotation)].filter(v => v !== undefined);
  if (rotations.some(v => !Number.isFinite(Number(v)) || Number(v) % 360 !== 0) ||
      !['1:1', 'N/A', undefined].includes(video.sample_aspect_ratio) ||
      !['progressive', 'unknown', undefined].includes(video.field_order)) timelineFail('旋转、非方形像素或隔行视频需先规范化，不能无损映射到本批时间线');
  if (!Number.isFinite(Number(video.start_time || 0)) || Math.abs(Number(video.start_time || 0)) > 0.001) timelineFail('不支持非零起始时间的视频流');
  let channels = 0, sampleRate = 0;
  if (includeAudio && audios.length) {
    const audio = audios[0];
    channels = Number(audio.channels); sampleRate = Number(audio.sample_rate);
    if (audios.length !== 1 || ![1, 2].includes(channels) || ![44100, 48000].includes(sampleRate) ||
        !Number.isFinite(Number(audio.start_time || 0)) || Math.abs(Number(audio.start_time || 0)) > 0.001 ||
        !Number.isFinite(Number(audio.duration)) || Number(audio.duration) + 1 / fps < duration) {
      timelineFail('保留声音仅支持与视频同步的单路单声道/双声道44.1/48kHz音轨；请规范化或明确选择静音');
    }
  }
  return { width, height, frames, numerator, denominator, timebase, ntsc, channels, sampleRate };
}

export function buildTimelinePlan(request, metadata) {
  if (!Array.isArray(metadata) || metadata.length !== request.clips.length) timelineFail('视频探测结果不完整');
  const first = metadata[0], fps = first.numerator / first.denominator;
  let cursor = 0;
  const clips = request.clips.map((clip, index) => {
    const meta = metadata[index];
    if (['width', 'height', 'numerator', 'denominator'].some(key => meta[key] !== first[key])) {
      timelineFail('本批不自动缩放或转码：所有视频必须分辨率、帧率一致');
    }
    const inFrame = Math.round(clip.startSec * fps);
    const outFrame = clip.endSec === null ? meta.frames : Math.round(clip.endSec * fps);
    if (inFrame < 0 || outFrame > meta.frames || outFrame <= inFrame) timelineFail(`第 ${index + 1} 段入出点超出视频或短于一帧`);
    const start = cursor; cursor += outFrame - inFrame;
    if (cursor / fps > TIMELINE_EXPORT_LIMITS.seconds) timelineFail('时间线总时长超过30分钟');
    return { ...clip, meta, inFrame, outFrame, start, end: cursor };
  });
  return { title: request.title, includeAudio: request.includeAudio, rate: first, frames: cursor, clips };
}
