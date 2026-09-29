export const VIDEO_KEYING_MAX_SOURCE_VIDEO_BYTES = 0x1e * 0x400 * 0x400;
const SOURCE_VIDEO_SIZE_BYTE_FIELDS = Object['freeze']([
  'videoSizeBytes',
  'videoByteSize',
  'fileSize',
  'sizeBytes',
  'byteSize',
]);
export function resolveVideoKeyingSourceVideoSizeBytes(_0x3fffe2 = {}) {
  for (const _0x4aadd9 of SOURCE_VIDEO_SIZE_BYTE_FIELDS) {
    const _0x955bbd = Number(_0x3fffe2?.[_0x4aadd9]);
    if (Number['isFinite'](_0x955bbd) && _0x955bbd > 0x0) return _0x955bbd;
  }
  return 0x0;
}
export function isVideoKeyingSourceVideoTooLarge(_0x348be9 = {}) {
  const _0x7d0f98 = resolveVideoKeyingSourceVideoSizeBytes(_0x348be9);
  return _0x7d0f98 > VIDEO_KEYING_MAX_SOURCE_VIDEO_BYTES;
}
export function getVideoKeyingMaxSourceVideoMB() {
  return Math['round'](VIDEO_KEYING_MAX_SOURCE_VIDEO_BYTES / 0x400 / 0x400);
}
