export const VIDEO_PLAYBACK_PROXY_MAX_LONG_EDGE = 0x500;
export const VIDEO_PLAYBACK_PROXY_VERSION = 'v2-1280';
const VIDEO_PLAYBACK_PROXY_MIN_TIMEOUT_MS = 0x5 * 0x3c * 0x3e8,
  VIDEO_PLAYBACK_PROXY_MAX_TIMEOUT_MS = 0x6 * 0x3c * 0x3c * 0x3e8;
export function resolveVideoPlaybackProxyTimeoutMs(durationSec) {
  const durationMs = Math.max(0, Number(durationSec || 0)) * 0x3e8;
  return Math.min(
    VIDEO_PLAYBACK_PROXY_MAX_TIMEOUT_MS,
    Math.max(VIDEO_PLAYBACK_PROXY_MIN_TIMEOUT_MS, durationMs * 0xc),
  );
}
export function createVideoPlaybackProxyWorkDeduper() {
  const pending = new Map();
  return {
    async run(key, factory) {
      const workKey = String(key || '').trim();
      if (!workKey || typeof factory !== 'function') return factory?.();
      while (pending.has(workKey)) {
        try {
          return await pending.get(workKey);
        } catch {}
      }
      const promise = Promise.resolve().then(factory);
      pending.set(workKey, promise);
      try {
        return await promise;
      } finally {
        if (pending.get(workKey) === promise) pending.delete(workKey);
      }
    },
  };
}
export function finalizeVideoPlaybackProxyMigrationResult(
  result = {},
  { sourceLocalPath: sourceLocalPath = '', targetVersion: targetVersion = '' } = {},
) {
  const normalizedSource = String(sourceLocalPath || '')
    .trim()
    .replace(/\\/g, '/');
  if (
    String(targetVersion || '').trim() !== VIDEO_PLAYBACK_PROXY_VERSION ||
    String(result?.videoProxyStatus || '').trim() !== 'not_required' ||
    !normalizedSource
  )
    return result;
  return {
    ...result,
    displayLocalPath: normalizedSource,
    displayUrl: '/' + normalizedSource.replace(/^\/+/, ''),
    videoProxyVersion: VIDEO_PLAYBACK_PROXY_VERSION,
  };
}
function normalizeCodecValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}
export function needsBrowserVideoProxy(meta = {}) {
  const codecName = normalizeCodecValue(meta.codecName),
    pixelFormat = normalizeCodecValue(meta.pixelFormat),
    formatName = normalizeCodecValue(meta.formatName),
    width = Math.max(0, Math.trunc(Number(meta.width || 0)) || 0),
    height = Math.max(0, Math.trunc(Number(meta.height || 0)) || 0);
  if (Math.max(width, height) > VIDEO_PLAYBACK_PROXY_MAX_LONG_EDGE) return true;
  if (!codecName) return true;
  if (codecName === 'h264')
    return !!pixelFormat && pixelFormat !== 'yuv420p' && pixelFormat !== 'yuvj420p';
  if (codecName === 'vp8' || codecName === 'vp9')
    return !formatName.includes('webm') && !formatName.includes('matroska');
  if (codecName === 'av1') return false;
  return true;
}
export function getVideoPlaybackProxyFilename(assetKey) {
  return String(assetKey || '').trim() + '.proxy-' + VIDEO_PLAYBACK_PROXY_VERSION + '.mp4';
}
export function isCurrentVideoPlaybackProxyLocalPath(localPath, assetKey) {
  const normalized = String(localPath || '')
    .trim()
    .replace(/\\/g, '/');
  if (!normalized) return false;
  return normalized.endsWith('/derived/video/' + getVideoPlaybackProxyFilename(assetKey));
}
export function buildVideoPlaybackProxyFfmpegArgs({
  inputPath: inputPath,
  outputPath: outputPath,
  preset: preset,
  crf: crf,
} = {}) {
  const maxLongEdge = VIDEO_PLAYBACK_PROXY_MAX_LONG_EDGE,
    scaleFilter = [
      "scale=w='min(iw\\," + maxLongEdge + ")'",
      "h='min(ih\\," + maxLongEdge + ")'",
      'force_original_aspect_ratio=decrease',
      'force_divisible_by=2',
    ].join(':');
  return [
    '-y',
    '-i',
    inputPath,
    '-map',
    '0:v:0',
    '-map',
    '0:a?',
    '-dn',
    '-sn',
    '-vf',
    scaleFilter,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-profile:v',
    'high',
    '-preset',
    preset,
    '-crf',
    crf,
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-movflags',
    '+faststart',
    outputPath,
  ];
}
