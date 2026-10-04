import { mkdirSync } from 'node:fs';
import path from 'node:path';
export function buildVideoReverseFfmpegArgs({
  sourceAbs: sourceAbs,
  outAbs: outAbs,
  hasAudio: hasAudio = false,
} = {}) {
  if (!sourceAbs || !outAbs) throw new Error('Invalid video reverse source');
  const list = ['[0:v]reverse,setpts=PTS-STARTPTS,format=yuv420p[v]'];
  hasAudio && list.push('[0:a]areverse,asetpts=PTS-STARTPTS[a]');
  const list2 = ['-y', '-i', sourceAbs, '-filter_complex', list.join(';'), '-map', '[v]'];
  return (
    hasAudio ? list2.push('-map', '[a]') : list2.push('-an'),
    list2.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-preset', 'fast'),
    hasAudio && list2.push('-c:a', 'aac'),
    list2.push('-movflags', '+faststart', outAbs),
    list2
  );
}
export function createVideoReverseMediaTaskHandler({
  createOutputFilename: createOutputFilename,
  ffprobeHasAudio: ffprobeHasAudio,
  ffprobeVideoMeta: ffprobeVideoMeta,
  getOutputDir: getOutputDir,
  getRuntimeToolOrFallback: getRuntimeToolOrFallback,
  runFfmpegTask: runFfmpegTask,
  resolveMediaTaskSource: resolveMediaTaskSource,
  toOutputLocalPath: toOutputLocalPath,
}) {
  return async (value, item) => {
    const sourceAbs2 = resolveMediaTaskSource(value.payload.src),
      durationSec = await ffprobeVideoMeta(item, value, sourceAbs2);
    if (!durationSec.width || !durationSec.height) throw new Error('Source video has no video stream');
    const hasAudio2 = await ffprobeHasAudio(item, value, sourceAbs2),
      key = path.join(getOutputDir(), 'ReverseVideo');
    mkdirSync(key, { recursive: true });
    const filename = createOutputFilename('reverse', 'mp4'),
      outAbs2 = path.join(key, filename),
      path2 = toOutputLocalPath('ReverseVideo', filename),
      videoReverseFfmpegArgs = buildVideoReverseFfmpegArgs({
        sourceAbs: sourceAbs2,
        outAbs: outAbs2,
        hasAudio: hasAudio2,
      }),
      runFfmpeg =
        typeof runFfmpegTask === 'function'
          ? runFfmpegTask
          : (task, queue, args, options) =>
              queue.runProcess(task, getRuntimeToolOrFallback('ffmpeg'), args, options);
    return (
      await runFfmpeg(value, item, videoReverseFfmpegArgs, {
        durationSec: durationSec.duration || 0,
        progressMessage: 'Reversing video',
      }),
      {
        success: true,
        filename: filename,
        path: path2,
        localPath: path2,
        url: '/' + path2,
        videoDuration: durationSec.duration || 0,
        fps: durationSec.fps || 0,
        videoWidth: durationSec.width,
        videoHeight: durationSec.height,
      }
    );
  };
}
