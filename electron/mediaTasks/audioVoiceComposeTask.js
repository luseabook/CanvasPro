import { mkdirSync } from 'node:fs';
import path from 'node:path';
function toNumber(value, fallback = 0x0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}
function normalizeNonNegative(value, fallback = 0x0) {
  return Math.max(0x0, toNumber(value, fallback));
}
function normalizeSourceKind(value = '') {
  return String(value || '').trim() === 'audio' ? 'audio' : 'video';
}
function normalizeOutputKind(value = '', fallback = 'video') {
  if (String(value || '').trim() === 'audio') return 'audio';
  return normalizeSourceKind(fallback);
}
function normalizeExplicitClipDurationMs(clip = {}) {
  return (
    Math.max(0x0, Math.round(Number(clip.durationMs) || 0x0)) ||
    Math.max(0x0, Math.round(Number(clip.durationSec) * 0x3e8 || 0x0))
  );
}
export function normalizeAudioVoiceClips(clips = []) {
  if (!Array.isArray(clips)) return [];
  return clips
    .map((clip) => {
      if (!clip || typeof clip !== 'object') return null;
      const src = String(clip.src ?? clip.localPath ?? clip.path ?? clip.audioUrl ?? '').trim();
      if (!src) return null;
      const startMs = Math.max(
          0x0,
          Math.round(Number(clip.startMs ?? clip.timelineStartMs ?? 0x0) || 0x0),
        ),
        endMs = Math.max(
          startMs,
          Math.round(Number(clip.endMs ?? clip.timelineEndMs ?? startMs) || startMs),
        ),
        explicitDurationMs = normalizeExplicitClipDurationMs(clip),
        spanMs = endMs > startMs ? endMs - startMs : 0x0,
        durationMs = explicitDurationMs || spanMs;
      if (durationMs <= 0x0) return null;
      return {
        src: src,
        startSec: startMs / 0x3e8,
        durationSec: durationMs / 0x3e8,
        hasExplicitDuration: explicitDurationMs > 0x0,
      };
    })
    .filter(Boolean);
}
async function readFfprobeJson(queue, task, getRuntimeToolOrFallback, ffprobeArgs) {
  const result = await queue.runProcess(task, getRuntimeToolOrFallback('ffprobe'), ffprobeArgs),
    stdout = result.stdout.toString('utf8').trim();
  return stdout ? JSON.parse(stdout) : {};
}
async function ffprobeMediaDuration(queue, task, getRuntimeToolOrFallback, sourceAbs) {
  try {
    const payload = await readFfprobeJson(queue, task, getRuntimeToolOrFallback, [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'json',
      sourceAbs,
    ]);
    return Number(payload?.format?.duration || 0x0) || 0x0;
  } catch {
    return 0x0;
  }
}
async function resolveAudioVoiceClipDurations(clips, clipAbs, queue, task, getRuntimeToolOrFallback) {
  const resolved = [];
  for (let index = 0x0; index < clips.length; index += 0x1) {
    const clip = clips[index];
    if (clip.hasExplicitDuration) {
      resolved.push(clip);
      continue;
    }
    const probedDurationSec = await ffprobeMediaDuration(
      queue,
      task,
      getRuntimeToolOrFallback,
      clipAbs[index],
    );
    resolved.push(probedDurationSec > 0x0 ? { ...clip, durationSec: probedDurationSec } : clip);
  }
  return resolved;
}
function buildTimelineAudioFilterParts(clips = [], leadingInputs = 0x0, totalDurationSec = 0x0) {
  const parts = clips.map((clip, index) => {
      const inputIndex = leadingInputs + index,
        delayMs = Math.max(0x0, Math.round(clip.startSec * 0x3e8));
      return (
        '[' +
        inputIndex +
        ':a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=0:' +
        clip.durationSec +
        ',asetpts=PTS-STARTPTS,adelay=' +
        delayMs +
        '|' +
        delayMs +
        '[av' +
        index +
        ']'
      );
    }),
    labels = clips.map((clip, index) => '[av' + index + ']').join(''),
    mix =
      clips.length === 0x1
        ? '[av0]apad'
        : labels + 'amix=inputs=' + clips.length + ':duration=longest:normalize=0,apad';
  return (parts.push(mix + ',atrim=0:' + totalDurationSec + '[a]'), parts);
}
export function buildAudioVoiceComposeFfmpegArgs({
  sourceKind: sourceKind = 'video',
  outputKind: outputKind = '',
  sourceAbs: sourceAbs = '',
  clipAbs: clipAbs = [],
  clips: clips = [],
  durationSec: durationSec = 0x0,
  outAbs: outAbs = '',
} = {}) {
  if (!outAbs || !durationSec || clips.length <= 0x0)
    throw new Error('Invalid audio voice compose payload');
  const source = normalizeSourceKind(sourceKind),
    output = normalizeOutputKind(outputKind, source),
    keepSourceVideo = source === 'video' && output === 'video',
    args = ['-y'];
  if (keepSourceVideo) args.push('-i', sourceAbs);
  (clipAbs.forEach((clip) => args.push('-i', clip)),
    args.push(
      '-filter_complex',
      buildTimelineAudioFilterParts(clips, keepSourceVideo ? 0x1 : 0x0, durationSec).join(';'),
    ));
  if (keepSourceVideo)
    return (
      args.push(
        '-map',
        '0:v:0',
        '-map',
        '[a]',
        '-t',
        String(durationSec),
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-profile:v',
        'high',
        '-preset',
        'fast',
        '-c:a',
        'aac',
        '-movflags',
        '+faststart',
        outAbs,
      ),
      args
    );
  return (
    args.push(
      '-map',
      '[a]',
      '-t',
      String(durationSec),
      '-vn',
      '-c:a',
      source === 'video' ? 'aac' : 'libmp3lame',
      '-b:a',
      '192k',
      outAbs,
    ),
    args
  );
}
async function createAudioVoiceVideoPosterFields({
  queue: queue,
  task: task,
  getOutputDir: getOutputDir,
  getRuntimeToolOrFallback: getRuntimeToolOrFallback,
  createOutputFilename: createOutputFilename,
  toOutputLocalPath: toOutputLocalPath,
  outAbs: outAbs,
}) {
  const posterDir = path.join(getOutputDir(), 'VideoThumbs');
  mkdirSync(posterDir, { recursive: true });
  const posterFilename = createOutputFilename('voice_compose_poster', 'jpg'),
    posterAbs = path.join(posterDir, posterFilename),
    posterLocalPath = toOutputLocalPath('VideoThumbs', posterFilename);
  return (
    await queue.runProcess(
      task,
      getRuntimeToolOrFallback('ffmpeg'),
      [
        '-y',
        '-ss',
        '0',
        '-i',
        outAbs,
        '-frames:v',
        '1',
        '-vf',
        'scale=240:-2',
        '-q:v',
        '8',
        '-an',
        posterAbs,
      ],
      { progressMessage: 'Creating voice video poster' },
    ),
    {
      posterLocalPath: posterLocalPath,
      thumbLocalPath: posterLocalPath,
      posterUrl: '/' + posterLocalPath,
      thumbUrl: '/' + posterLocalPath,
    }
  );
}
export function createAudioVoiceComposeMediaTaskHandler({
  createOutputFilename: createOutputFilename,
  ffprobeVideoMeta: ffprobeVideoMeta,
  getOutputDir: getOutputDir,
  getRuntimeToolOrFallback: getRuntimeToolOrFallback,
  runFfmpegTask: runFfmpegTask,
  resolveMediaTaskSource: resolveMediaTaskSource,
  toOutputLocalPath: toOutputLocalPath,
}) {
  return async (task, queue) => {
    const payload = task.payload || {},
      args = payload.args || {},
      sourceKind = normalizeSourceKind(args.sourceKind ?? payload.sourceKind),
      outputKind = normalizeOutputKind(args.outputKind ?? payload.outputKind, sourceKind),
      sourceAbs = resolveMediaTaskSource(payload.src || args.src),
      clips = normalizeAudioVoiceClips(args.clips || payload.clips);
    if (clips.length <= 0x0) throw new Error('Invalid audio voice compose clips');
    const clipAbs = clips.map((clip) => resolveMediaTaskSource(clip.src)),
      clipDurations = await resolveAudioVoiceClipDurations(
        clips,
        clipAbs,
        queue,
        task,
        getRuntimeToolOrFallback,
      ),
      clipTimelineEndSec = Math.max(
        ...clipDurations.map((clip) => clip.startSec + clip.durationSec),
        0x0,
      ),
      videoMeta = sourceKind === 'video' ? await ffprobeVideoMeta(queue, task, sourceAbs) : null;
    if (sourceKind === 'video' && (!videoMeta?.width || !videoMeta?.height))
      throw new Error('Source video has no video stream');
    const sourceDurationSec =
        sourceKind === 'video'
          ? Number(videoMeta?.duration || 0x0) || 0x0
          : await ffprobeMediaDuration(queue, task, getRuntimeToolOrFallback, sourceAbs),
      durationSec =
        normalizeNonNegative(args.durationSec ?? payload.durationSec, 0x0) ||
        normalizeNonNegative((args.durationMs ?? payload.durationMs) / 0x3e8, 0x0) ||
        sourceDurationSec ||
        clipTimelineEndSec;
    if (!(durationSec > 0x0)) throw new Error('Invalid audio voice compose duration');
    const outputVideo = outputKind === 'video',
      outputFolder = outputVideo ? 'AudioVoiceVideo' : 'AudioVoiceAudio',
      outputDir = path.join(getOutputDir(), outputFolder);
    mkdirSync(outputDir, { recursive: true });
    const extension = outputVideo ? 'mp4' : sourceKind === 'video' ? 'm4a' : 'mp3',
      filename = createOutputFilename('voice_compose', extension),
      outAbs = path.join(outputDir, filename),
      localPath = toOutputLocalPath(outputFolder, filename),
      ffmpegArgs = buildAudioVoiceComposeFfmpegArgs({
        sourceKind: sourceKind,
        outputKind: outputKind,
        sourceAbs: sourceAbs,
        clipAbs: clipAbs,
        clips: clipDurations,
        durationSec: durationSec,
        outAbs: outAbs,
      }),
      runFfmpeg =
        typeof runFfmpegTask === 'function'
          ? runFfmpegTask
          : (task, queue, args, options) =>
              queue.runProcess(task, getRuntimeToolOrFallback('ffmpeg'), args, options);
    await runFfmpeg(task, queue, ffmpegArgs, {
      durationSec: durationSec,
      progressMessage: outputVideo ? 'Composing voice video' : 'Composing voice audio',
    });
    const posterFields = outputVideo
      ? await createAudioVoiceVideoPosterFields({
          queue: queue,
          task: task,
          getOutputDir: getOutputDir,
          getRuntimeToolOrFallback: getRuntimeToolOrFallback,
          createOutputFilename: createOutputFilename,
          toOutputLocalPath: toOutputLocalPath,
          outAbs: outAbs,
        }).catch(() => ({}))
      : {};
    return {
      success: true,
      filename: filename,
      path: localPath,
      localPath: localPath,
      url: '/' + localPath,
      audioDuration: durationSec,
      ...(outputVideo
        ? {
            videoDuration: durationSec,
            videoWidth: videoMeta?.width || 0x0,
            videoHeight: videoMeta?.height || 0x0,
            fps: videoMeta?.fps || 0x0,
            ...posterFields,
          }
        : {}),
    };
  };
}
