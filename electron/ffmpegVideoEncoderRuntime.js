const SOFTWARE_H264_ENCODER_PROFILE = Object.freeze({ id: 'software', codec: 'libx264', hardware: false }),
  PLATFORM_H264_ENCODER_PROFILES = Object.freeze({
    win32: Object.freeze([
      Object.freeze({ id: 'nvidia-nvenc', codec: 'h264_nvenc', hardware: true }),
      Object.freeze({ id: 'amd-amf', codec: 'h264_amf', hardware: true }),
      Object.freeze({ id: 'intel-qsv', codec: 'h264_qsv', hardware: true }),
    ]),
    darwin: Object.freeze([
      Object.freeze({ id: 'apple-videotoolbox', codec: 'h264_videotoolbox', hardware: true }),
    ]),
  }),
  SOFTWARE_ONLY_VIDEO_OPTIONS = new Set(['-crf', '-pix_fmt', '-preset', '-profile:v']),
  DEFAULT_PROBE_TIMEOUT_MS = 0x3a98;
function clampInteger(value, min, max, fallback) {
  const rounded = Math.round(Number(value));
  if (!Number.isFinite(rounded)) return fallback;
  return Math.max(min, Math.min(max, rounded));
}
function normalizeSoftwarePreset(preset) {
  const normalized = String(preset || '')
    .trim()
    .toLowerCase();
  return normalized || 'fast';
}
function normalizeCrf(crf) {
  return clampInteger(crf, 0x0, 0x33, 0x17);
}
function readOptionValue(args, flag, fallback = '') {
  for (let index = args.length - 0x2; index >= 0x0; index -= 0x1) {
    if (args[index] === flag) return String(args[index + 0x1] ?? fallback);
  }
  return fallback;
}
function hasEncoder(encodersOutput, codec) {
  const escaped = String(codec || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (
    !!escaped && new RegExp('(?:^|\\s)' + escaped + '(?:\\s|$)', 'm').test(String(encodersOutput || ''))
  );
}
function getPlatformProfiles(platform) {
  return PLATFORM_H264_ENCODER_PROFILES[String(platform || '').trim()] || [];
}
function mapNvencPreset(preset) {
  switch (normalizeSoftwarePreset(preset)) {
    case 'ultrafast':
    case 'superfast':
    case 'veryfast':
      return 'p3';
    case 'slow':
    case 'slower':
      return 'p5';
    case 'veryslow':
      return 'p6';
    default:
      return 'p4';
  }
}
function mapQsvPreset(preset) {
  const normalized = normalizeSoftwarePreset(preset);
  if (['veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow'].includes(normalized))
    return normalized;
  return 'fast';
}
function mapVideoToolboxQuality(crf) {
  return clampInteger(0x64 - normalizeCrf(crf) * 1.5, 0x1, 0x64, 0x41);
}
export function buildHardwareH264EncoderArgs(
  profile,
  { softwarePreset: softwarePreset = 'fast', crf: crf = 0x17 } = {},
) {
  const codec = String(profile?.codec || ''),
    normalizedCrf = normalizeCrf(crf);
  if (codec === 'h264_nvenc')
    return [
      '-c:v',
      codec,
      '-pix_fmt',
      'yuv420p',
      '-profile:v',
      'high',
      '-preset',
      mapNvencPreset(softwarePreset),
      '-tune',
      'hq',
      '-rc',
      'vbr',
      '-cq',
      String(normalizedCrf),
      '-b:v',
      '0',
    ];
  if (codec === 'h264_amf')
    return [
      '-c:v',
      codec,
      '-pix_fmt',
      'yuv420p',
      '-profile:v',
      'high',
      '-quality',
      /^(?:ultrafast|superfast|veryfast|fast)$/.test(normalizeSoftwarePreset(softwarePreset))
        ? 'speed'
        : 'balanced',
      '-rc',
      'cqp',
      '-qp_i',
      String(normalizedCrf),
      '-qp_p',
      String(normalizedCrf),
      '-qp_b',
      String(normalizedCrf),
    ];
  if (codec === 'h264_qsv')
    return [
      '-c:v',
      codec,
      '-pix_fmt',
      'nv12',
      '-profile:v',
      'high',
      '-preset',
      mapQsvPreset(softwarePreset),
      '-global_quality',
      String(normalizedCrf),
    ];
  if (codec === 'h264_videotoolbox')
    return [
      '-c:v',
      codec,
      '-pix_fmt',
      'yuv420p',
      '-profile:v',
      'high',
      '-q:v',
      String(mapVideoToolboxQuality(normalizedCrf)),
      '-prio_speed',
      /^(?:ultrafast|superfast|veryfast|fast)$/.test(normalizeSoftwarePreset(softwarePreset)) ? '1' : '0',
    ];
  return ['-c:v', SOFTWARE_H264_ENCODER_PROFILE.codec];
}
export function usesSoftwareH264Encoder(args = []) {
  return args.some(
    (value, index) => value === '-c:v' && args[index + 0x1] === SOFTWARE_H264_ENCODER_PROFILE.codec,
  );
}
export function applyHardwareH264EncoderProfile(args = [], profile = {}) {
  const source = Array.isArray(args) ? [...args] : [];
  if (!profile?.hardware || !usesSoftwareH264Encoder(source)) return source;
  const softwarePreset = readOptionValue(source, '-preset', 'fast'),
    crf = readOptionValue(source, '-crf', '23'),
    hardwareArgs = buildHardwareH264EncoderArgs(profile, { softwarePreset: softwarePreset, crf: crf }),
    output = [];
  for (let index = 0x0; index < source.length; index += 0x1) {
    const value = source[index];
    if (value === '-c:v' && source[index + 0x1] === SOFTWARE_H264_ENCODER_PROFILE.codec) {
      (output.push(...hardwareArgs), (index += 0x1));
      continue;
    }
    if (SOFTWARE_ONLY_VIDEO_OPTIONS.has(value)) {
      index += 0x1;
      continue;
    }
    output.push(value);
  }
  return output;
}
function buildEncoderProbeArgs(profile) {
  return [
    '-hide_banner',
    '-loglevel',
    'error',
    '-f',
    'lavfi',
    '-i',
    'color=c=black:s=256x256:r=1',
    '-frames:v',
    '1',
    ...buildHardwareH264EncoderArgs(profile, { softwarePreset: 'fast', crf: 0x17 }),
    '-f',
    'null',
    '-',
  ];
}
export async function probeFfmpegH264Encoder({
  ffmpegPath: ffmpegPath,
  platform: platform = process.platform,
  runCapture: runCapture,
  cwd: cwd = process.cwd(),
  timeoutMs: timeoutMs = DEFAULT_PROBE_TIMEOUT_MS,
} = {}) {
  if (!ffmpegPath || typeof runCapture !== 'function') return SOFTWARE_H264_ENCODER_PROFILE;
  let encodersOutput = '';
  try {
    const captured = await runCapture(ffmpegPath, ['-hide_banner', '-encoders'], {
      cwd: cwd,
      timeoutMs: timeoutMs,
    });
    encodersOutput = Buffer.isBuffer(captured) ? captured.toString('utf8') : String(captured || '');
  } catch {
    return SOFTWARE_H264_ENCODER_PROFILE;
  }
  for (const profile of getPlatformProfiles(platform)) {
    if (!hasEncoder(encodersOutput, profile.codec)) continue;
    try {
      return (
        await runCapture(ffmpegPath, buildEncoderProbeArgs(profile), { cwd: cwd, timeoutMs: timeoutMs }),
        profile
      );
    } catch {}
  }
  return SOFTWARE_H264_ENCODER_PROFILE;
}
function shouldSkipSoftwareFallback(error) {
  return (
    error?.name === 'MediaTaskCancelledError' ||
    error?.name === 'MediaTaskProcessTimeoutError' ||
    error?.code === 'MEDIA_TASK_PROCESS_TIMEOUT'
  );
}
export function createFfmpegVideoEncoderRuntime({
  ffmpegPath: ffmpegPath,
  platform: platform = process.platform,
  runCapture: runCapture,
  cwd: cwd = process.cwd(),
  logger: logger = console,
} = {}) {
  let cachedProfile = null,
    pendingProbe = null;
  const rememberProfile = (profile) => {
      return ((cachedProfile = profile || SOFTWARE_H264_ENCODER_PROFILE), cachedProfile);
    },
    getProfile = async () => {
      if (cachedProfile) return cachedProfile;
      return (
        !pendingProbe &&
          (pendingProbe = probeFfmpegH264Encoder({
            ffmpegPath: ffmpegPath,
            platform: platform,
            runCapture: runCapture,
            cwd: cwd,
          }).then((probeResult) => {
            const selected = rememberProfile(probeResult);
            return (
              logger?.info?.(
                '[ffmpeg] H.264 encoder selected: ' + selected.id + ' (' + selected.codec + ')',
              ),
              selected
            );
          })),
        pendingProbe
      );
    };
  return {
    getProfile: getProfile,
    getCachedProfile() {
      return cachedProfile;
    },
    warmup() {
      return getProfile();
    },
    async runTask(task, queue, args = [], options = {}) {
      if (!queue || typeof queue.runProcess !== 'function')
        throw new Error('Missing media task process runner');
      const sourceArgs = Array.isArray(args) ? [...args] : [];
      if (!usesSoftwareH264Encoder(sourceArgs))
        return queue.runProcess(task, ffmpegPath, sourceArgs, options);
      const profile = await getProfile();
      if (!profile.hardware) return queue.runProcess(task, ffmpegPath, sourceArgs, options);
      const hardwareArgs = applyHardwareH264EncoderProfile(sourceArgs, profile);
      try {
        return await queue.runProcess(task, ffmpegPath, hardwareArgs, options);
      } catch (error) {
        if (shouldSkipSoftwareFallback(error)) throw error;
        return (
          rememberProfile(SOFTWARE_H264_ENCODER_PROFILE),
          (pendingProbe = Promise.resolve(SOFTWARE_H264_ENCODER_PROFILE)),
          logger?.warn?.(
            '[ffmpeg] ' + profile.codec + ' failed; falling back to libx264 for this session.',
          ),
          queue.emitProgress?.(
            task,
            task?.progress || 0x0,
            'Hardware encoder unavailable; retrying with CPU',
          ),
          queue.throwIfCancelled?.(task),
          queue.runProcess(task, ffmpegPath, sourceArgs, options)
        );
      }
    },
  };
}
let configuredRuntime = null;
export function configureFfmpegVideoEncoderRuntime(options = {}) {
  return (
    (configuredRuntime = createFfmpegVideoEncoderRuntime(options)),
    void configuredRuntime.warmup(),
    configuredRuntime
  );
}
export function runFfmpegVideoTask(task, queue, args = [], options = {}) {
  if (!configuredRuntime) throw new Error('FFmpeg video encoder runtime is not configured');
  return configuredRuntime.runTask(task, queue, args, options);
}
export { SOFTWARE_H264_ENCODER_PROFILE };
