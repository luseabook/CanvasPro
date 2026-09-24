import { mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
const PRESET_WECHAT = 'wechat',
  PRESET_HD = 'hd';
function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}
function normalizeInteger(value, min, max, fallback) {
  return Math.round(clampNumber(value, min, max, fallback));
}
function normalizePreset(value) {
  return String(value || '')
    .trim()
    .toLowerCase() === PRESET_HD
    ? PRESET_HD
    : PRESET_WECHAT;
}
function normalizeQuality(value, fallback = 'balanced') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return ['compact', 'balanced', 'high'].includes(normalized) ? normalized : fallback;
}
function getQualityMaxColors(quality) {
  if (quality === 'compact') return 0x40;
  if (quality === 'high') return 0x100;
  return 0x80;
}
function getQualityBayerScale(quality) {
  if (quality === 'compact') return 0x5;
  if (quality === 'high') return 0x2;
  return 0x3;
}
export function normalizeVideoToGifOptions(options = {}, meta = {}) {
  const preset = normalizePreset(options.preset),
    sourceDuration = Math.max(0, Number(meta.duration) || 0),
    minGap = sourceDuration > 0 ? Math.min(0.1, sourceDuration) : 0.1,
    maxStart = sourceDuration > 0 ? Math.max(0, sourceDuration - minGap) : Number.MAX_SAFE_INTEGER,
    start = clampNumber(options.start, 0, maxStart, 0),
    rawEnd = Number(options.end),
    fallbackEnd = sourceDuration > start ? sourceDuration : start + 3,
    end = clampNumber(
      Number.isFinite(rawEnd) ? rawEnd : fallbackEnd,
      start + minGap,
      sourceDuration > start ? sourceDuration : Number.MAX_SAFE_INTEGER,
      fallbackEnd,
    ),
    sourceWidth = Math.max(0, Number(options.sourceWidth) || Number(meta.width) || 0),
    sourceHeight = Math.max(0, Number(options.sourceHeight) || Number(meta.height) || 0),
    defaultSize = 0x2d0,
    sizeCandidate =
      Number(options.size) ||
      Math.max(Number(options.width) || 0, Number(options.height) || 0) ||
      defaultSize,
    size = normalizeInteger(sizeCandidate, 0x40, 0x780, defaultSize);
  let width = normalizeInteger(options.width, 0x1, 0x780, size),
    height = normalizeInteger(options.height, 0x1, 0x780, size);
  if (sourceWidth > 0 && sourceHeight > 0) {
    const aspectRatio = sourceWidth / sourceHeight;
    aspectRatio >= 0x1
      ? ((width = size), (height = Math.max(0x1, Math.round(size / aspectRatio))))
      : ((width = Math.max(0x1, Math.round(size * aspectRatio))), (height = size));
  }
  const quality = normalizeQuality(options.quality, preset === PRESET_WECHAT ? 'high' : 'balanced');
  return {
    preset: preset,
    quality: quality,
    start: start,
    end: end,
    duration: end - start,
    fps: normalizeInteger(options.fps, 0x4, 0x1e, preset === PRESET_WECHAT ? 0xf : 0x14),
    width: width,
    height: height,
    maxColors: normalizeInteger(options.maxColors, 0x10, 0x100, getQualityMaxColors(quality)),
    bayerScale: normalizeInteger(options.bayerScale, 0x0, 0x5, getQualityBayerScale(quality)),
    targetBytes: normalizeInteger(
      options.targetBytes,
      0x0,
      0x32 * 0x400 * 0x400,
      preset === PRESET_WECHAT ? 0x400 * 0x400 : 0x0,
    ),
  };
}
function buildScaleFilter({ width: width, height: height }) {
  return 'scale=' + width + ':' + height + ':flags=lanczos,setsar=1';
}
export function buildVideoToGifFfmpegArgs({ sourceAbs: sourceAbs, outAbs: outAbs, options: options = {} } = {}) {
  if (!sourceAbs || !outAbs) throw new Error('Invalid video to GIF source');
  const gifOptions = normalizeVideoToGifOptions(options),
    scaleFilter = buildScaleFilter(gifOptions),
    filterComplex = [
      '[0:v]fps=' + gifOptions.fps + ',' + scaleFilter + ',format=rgba,split[palette_source][gif_source]',
      '[palette_source]palettegen=max_colors=' +
        gifOptions.maxColors +
        ':reserve_transparent=1:stats_mode=diff[palette]',
      '[gif_source][palette]paletteuse=dither=bayer:bayer_scale=' +
        gifOptions.bayerScale +
        ':diff_mode=rectangle[out]',
    ].join(';');
  return [
    '-y',
    '-ss',
    String(gifOptions.start),
    '-t',
    String(gifOptions.duration),
    '-i',
    sourceAbs,
    '-filter_complex',
    filterComplex,
    '-map',
    '[out]',
    '-an',
    '-loop',
    '0',
    '-gifflags',
    '+transdiff',
    outAbs,
  ];
}
export function resolveNextVideoGifAdaptiveProfile({
  profile: profile = {},
  fileSize: fileSize = 0x0,
  targetBytes: targetBytes = 0x0,
  attempt: attempt = 0x0,
} = {}) {
  if (!(fileSize > targetBytes && targetBytes > 0x0)) return null;
  const secondOptimizePass = attempt >= 0x2,
    nextProfile = {
      fps: secondOptimizePass
        ? Math.max(0x6, Math.round((Number(profile.fps) || 0x6) * 0.85))
        : Number(profile.fps) || 0x6,
      maxColors: Math.max(0x20, Math.round((Number(profile.maxColors) || 0x20) * 0.75)),
      width: Math.max(0x1, Math.round(Number(profile.width) || 0x1)),
      height: Math.max(0x1, Math.round(Number(profile.height) || 0x1)),
    };
  if (
    nextProfile.width === profile.width &&
    nextProfile.height === profile.height &&
    nextProfile.fps === profile.fps &&
    nextProfile.maxColors === profile.maxColors
  )
    return null;
  return nextProfile;
}
export function createVideoToGifMediaTaskHandler({
  createOutputFilename: createOutputFilename,
  ffprobeVideoMeta: ffprobeVideoMeta,
  getOutputDir: getOutputDir,
  getRuntimeToolOrFallback: getRuntimeToolOrFallback,
  resolveMediaTaskSource: resolveMediaTaskSource,
  runFfmpegTask: runFfmpegTask,
  statFile: statFile = statSync,
  toOutputLocalPath: toOutputLocalPath,
}) {
  return async (task, queue) => {
    const payload = task.payload || {},
      sourceAbs = resolveMediaTaskSource(payload.src),
      videoMeta = await ffprobeVideoMeta(queue, task, sourceAbs);
    if (!videoMeta.width || !videoMeta.height)
      throw new Error('Source video has no video stream');
    const gifOptions = normalizeVideoToGifOptions(payload.args || payload, videoMeta),
      gifDir = path.join(getOutputDir(), 'Gif');
    mkdirSync(gifDir, { recursive: true });
    const filename = createOutputFilename(gifOptions.preset === PRESET_WECHAT ? 'wechat-gif' : 'hd-gif', 'gif'),
      outAbs = path.join(gifDir, filename),
      localPath = toOutputLocalPath('Gif', filename),
      runFfmpeg =
        typeof runFfmpegTask === 'function'
          ? runFfmpegTask
          : (task, queue, args, options) =>
              queue.runProcess(task, getRuntimeToolOrFallback('ffmpeg'), args, options),
      maxAttempts = gifOptions.targetBytes > 0x0 ? 0x6 : 0x1;
    let fileSize = 0x0,
      activeProfile = {
        fps: gifOptions.fps,
        maxColors: gifOptions.maxColors,
        width: gifOptions.width,
        height: gifOptions.height,
      };
    for (let attempt = 0x0; attempt < maxAttempts; attempt += 0x1) {
      (queue.throwIfCancelled?.(task),
        queue.emitProgress?.(
          task,
          task.progress || 0.01,
          attempt === 0x0 ? 'Encoding GIF' : 'Optimizing GIF (' + (attempt + 0x1) + '/' + maxAttempts + ')',
          { stage: attempt === 0x0 ? 'encode' : 'optimize' },
        ));
      const ffmpegArgs = buildVideoToGifFfmpegArgs({
        sourceAbs: sourceAbs,
        outAbs: outAbs,
        options: { ...gifOptions, ...activeProfile },
      });
      (await runFfmpeg(task, queue, ffmpegArgs, {
        durationSec: 0x0,
        progressMessage: 'Encoding GIF',
      }),
        (fileSize = Number(statFile(outAbs)?.size || 0x0)));
      if (!(gifOptions.targetBytes > 0x0) || fileSize <= gifOptions.targetBytes) break;
      if (attempt + 0x1 >= maxAttempts) break;
      const nextProfile = resolveNextVideoGifAdaptiveProfile({
        profile: activeProfile,
        fileSize: fileSize,
        targetBytes: gifOptions.targetBytes,
        attempt: attempt + 0x1,
      });
      if (!nextProfile) break;
      activeProfile = nextProfile;
    }
    return {
      success: true,
      filename: filename,
      path: localPath,
      localPath: localPath,
      url: '/' + localPath,
      mimeType: 'image/gif',
      imageWidth: activeProfile.width,
      imageHeight: activeProfile.height,
      duration: gifOptions.duration,
      fps: activeProfile.fps,
      maxColors: activeProfile.maxColors,
      fileSize: fileSize,
      targetBytes: gifOptions.targetBytes,
      targetExceeded: gifOptions.targetBytes > 0x0 && fileSize > gifOptions.targetBytes,
      preset: gifOptions.preset,
    };
  };
}
