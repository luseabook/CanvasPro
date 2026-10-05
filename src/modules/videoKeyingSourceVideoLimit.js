export const VIDEO_KEYING_MAX_SOURCE_VIDEO_BYTES = 30 * 1024 * 1024;
const SOURCE_VIDEO_SIZE_BYTE_FIELDS = Object['freeze']([
  'videoSizeBytes',
  'videoByteSize',
  'fileSize',
  'sizeBytes',
  'byteSize',
]);
export function resolveVideoKeyingSourceVideoSizeBytes(options = {}) {
  for (const value of SOURCE_VIDEO_SIZE_BYTE_FIELDS) {
    const count = Number(options?.[value]);
    if (Number['isFinite'](count) && count > 0) return count;
  }
  return 0;
}
export function isVideoKeyingSourceVideoTooLarge(options2 = {}) {
  const videoKeyingSourceVideoSizeBytes = resolveVideoKeyingSourceVideoSizeBytes(options2);
  return videoKeyingSourceVideoSizeBytes > VIDEO_KEYING_MAX_SOURCE_VIDEO_BYTES;
}
export function getVideoKeyingMaxSourceVideoMB() {
  return Math['round'](VIDEO_KEYING_MAX_SOURCE_VIDEO_BYTES / 1024 / 1024);
}
