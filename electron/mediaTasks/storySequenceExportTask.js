import { createMediaClipExportTaskHandler } from './mediaClipExportTask.js';

function onlyKeys(value, keys) {
  return value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).every(key => keys.includes(key));
}
const EXTENSIONS = {
  video: /\.(mp4|mov|webm|mkv|m4v|avi)$/i,
  image: /\.(png|jpe?g|webp|bmp)$/i,
  audio: /\.(mp3|wav|m4a|aac|flac|ogg)$/i,
};
function localMediaPath(value, kind) {
  return typeof value === 'string' && value.length <= 2048 && value === value.trim() &&
    /^(?:output\/|data\/(?:uploads|assets)\/)/.test(value) && EXTENSIONS[kind]?.test(value) &&
    !/[\\%?#:*"<>|\u0000-\u001f\u007f]/.test(value) && !value.split('/').some(part => !part || part === '.' || part === '..');
}
function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
function range(start, end) { return finite(start) && finite(end) && start >= 0 && end <= 3600 && end - start >= 0.0999; }

export function validateStorySequenceExport(payload) {
  const mediaVersion = payload?.args?.mediaVersion;
  const extended = mediaVersion === 2;
  if (!onlyKeys(payload, ['kind', 'taskId', 'nodeId', 'src', 'args']) || payload.kind !== 'storySequenceExport' ||
      !onlyKeys(payload.args, extended ? ['clips', 'duration', 'mediaVersion', 'audioClips'] : ['clips', 'duration'])) throw new Error('镜头初剪请求结构无效');
  const clips = payload.args.clips;
  if (!Array.isArray(clips) || !clips.length || clips.length > 60) throw new Error('镜头初剪只接受1–60段视觉片段');
  let total = 0;
  for (const [index, clip] of clips.entries()) {
    if (!onlyKeys(clip, ['src', 'kind', 'start', 'end']) ||
        !(clip.kind === 'video' || extended && clip.kind === 'image') || !localMediaPath(clip.src, clip.kind) ||
        !range(clip.start, clip.end) || clip.kind === 'image' && clip.start !== 0) throw new Error(`第${index + 1}段本地媒体或入出点无效`);
    total += clip.end - clip.start;
  }
  if (payload.src !== clips[0].src || !finite(payload.args.duration) || payload.args.duration > 3600 || total > 3600.001 ||
      Math.abs(total - payload.args.duration) > 0.001) throw new Error('镜头初剪总时长或主来源不符');
  if (extended) {
    const audioClips = payload.args.audioClips;
    if (!Array.isArray(audioClips) || audioClips.length > 1) throw new Error('只接受显式选择的零或一条独立音轨');
    for (const audio of audioClips) {
      if (!onlyKeys(audio, ['kind', 'src', 'start', 'end', 'timelineStart', 'timelineEnd', 'volume', 'muted']) ||
          audio.kind !== 'audio' || !localMediaPath(audio.src, 'audio') || !range(audio.start, audio.end) ||
          !finite(audio.timelineStart) || !finite(audio.timelineEnd) || audio.timelineStart < 0 || audio.timelineEnd > total + 0.001 ||
          Math.abs(audio.timelineEnd - audio.timelineStart - audio.end + audio.start) > 0.001 ||
          !finite(audio.volume) || audio.volume < 0 || audio.volume > 1 || typeof audio.muted !== 'boolean') throw new Error('单音轨路径、范围、起点、音量或静音字段无效');
    }
  }
  return clips.map(clip => ({ ...clip }));
}

// Uses the same task queue/ffprobe executable, never a new renderer. Images have no intrinsic
// duration: decode at most two input packets and require exactly one readable still frame.
export async function probeStorySequenceMedia(dependencies, queue, task, absolute, kind) {
  const image = kind === 'image';
  const args = ['-v', 'error', '-select_streams', image ? 'v:0' : 'a:0',
    ...(image ? ['-read_intervals', '%+#2', '-count_frames'] : []),
    '-show_entries', 'format=duration:stream=codec_type,codec_name,duration,width,height,nb_read_frames', '-of', 'json', absolute];
  const result = await queue.runProcess(task, dependencies.getRuntimeToolOrFallback('ffprobe'), args);
  const text = result.stdout.toString('utf8');
  if (text.length > 1024 * 1024) throw new Error('媒体探测结果超限，未启动渲染');
  const metadata = JSON.parse(text), stream = metadata.streams?.[0];
  if (image) {
    if (stream?.codec_type !== 'video' || !['png', 'mjpeg', 'webp', 'bmp'].includes(stream.codec_name) ||
        Number(stream.nb_read_frames) !== 1 || !Number.isFinite(Number(stream.width)) || Number(stream.width) <= 0 ||
        !Number.isFinite(Number(stream.height)) || Number(stream.height) <= 0) throw new Error('图片缺有效静态帧、是动画或编码不受支持；未启动渲染');
    return { width: Number(stream.width), height: Number(stream.height) };
  }
  const streamDuration = Number(stream?.duration), formatDuration = Number(metadata.format?.duration);
  const duration = Number.isFinite(streamDuration) && streamDuration > 0 ? streamDuration : formatDuration;
  if (stream?.codec_type !== 'audio' || !Number.isFinite(duration) || duration <= 0) throw new Error('音频缺音轨或实际时长未知；未启动渲染');
  return { duration };
}

// Version 1 stays video-only. The explicit v2 args fail closed on a batch-15 desktop host.
export function createStorySequenceExportTaskHandler(dependencies, renderFactory = createMediaClipExportTaskHandler) {
  const render = renderFactory(dependencies);
  return async (task, queue) => {
    const clips = validateStorySequenceExport(task.payload);
    const signature = JSON.stringify(task.payload);
    const audioClips = (task.payload.args.audioClips || []).map(clip => ({ ...clip }));
    for (const [index, clip] of clips.entries()) {
      queue.throwIfCancelled?.(task);
      const absolute = dependencies.resolveMediaTaskSource(clip.src);
      if (clip.kind === 'image') {
        await probeStorySequenceMedia(dependencies, queue, task, absolute, 'image');
      } else {
        const meta = await dependencies.ffprobeVideoMeta(queue, task, absolute);
        const duration = Number(meta?.duration);
        if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(meta?.width) || meta.width <= 0 ||
            !Number.isFinite(meta?.height) || meta.height <= 0 || clip.end > duration + 0.001) {
          throw new Error(`第${index + 1}段缺视频流、时长未知或出点超过实际探测时长；未启动成片渲染`);
        }
      }
    }
    for (const audio of audioClips) {
      queue.throwIfCancelled?.(task);
      // A muted selected source is still validated, not silently treated as a missing binding.
      const absolute = dependencies.resolveMediaTaskSource(audio.src);
      const meta = await probeStorySequenceMedia(dependencies, queue, task, absolute, 'audio');
      if (audio.end > meta.duration + 0.001) throw new Error('独立音轨出点超过实际探测时长；未启动成片渲染');
    }
    queue.throwIfCancelled?.(task);
    if (JSON.stringify(task.payload) !== signature) throw new Error('预检期间初剪请求已变化，未启动渲染');
    // No writes or ffmpeg calls before every source passes; native handler owns naming/scaling/audio/encoding.
    return render(task, queue);
  };
}
