import { post } from './apiBase.js';
const STORYBOARD_VIDEO_FRAME_MAX_COUNT = 100,
  STORYBOARD_VIDEO_FRAME_TIMEOUT_MS = 0x493e0;
function normalizeFrameCount(_0x3e3c84) {
  const _0x8bd8ac = Number(_0x3e3c84);
  if (!Number.isFinite(_0x8bd8ac) || _0x8bd8ac <= 0) return STORYBOARD_VIDEO_FRAME_MAX_COUNT;
  return Math.max(1, Math.min(STORYBOARD_VIDEO_FRAME_MAX_COUNT, Math.trunc(_0x8bd8ac)));
}
function normalizeFrameItem(_0x56b0f6, _0x35f453) {
  const _0x5a9420 = String(_0x56b0f6?.url || _0x56b0f6?.localUrl || '').trim(),
    _0x51f19d = String(_0x56b0f6?.localPath || _0x56b0f6?.path || '').trim();
  return {
    index: Number(_0x56b0f6?.index) || _0x35f453 + 1,
    start: Number(_0x56b0f6?.start) || 0,
    end: Number(_0x56b0f6?.end) || 0,
    duration: Number(_0x56b0f6?.duration) || 0,
    captureTime: Number(_0x56b0f6?.captureTime) || 0,
    url: _0x5a9420,
    localPath: _0x51f19d,
  };
}
export async function extractStoryboardVideoFramesFromServer(
  _0x21dd16,
  { maxFrames: maxFrames = STORYBOARD_VIDEO_FRAME_MAX_COUNT, exactCount: exactCount = false } = {},
) {
  const _0x217160 = String(_0x21dd16 || '').trim();
  if (!_0x217160) throw new Error('视频源不能为空');
  const _0x15e4b3 = await post(
    '/api/v2/video/storyboard_frames',
    {
      src: _0x217160,
      options: { maxFrames: normalizeFrameCount(maxFrames), exactCount: exactCount === true },
    },
    STORYBOARD_VIDEO_FRAME_TIMEOUT_MS,
  );
  if (!_0x15e4b3.success) throw new Error(_0x15e4b3.error || '视频分镜抽帧失败');
  const _0x3f4ab5 = _0x15e4b3.data || {};
  if (_0x3f4ab5.success === false) throw new Error(_0x3f4ab5.error || '视频分镜抽帧失败');
  const _0x54fbdc = Array.isArray(_0x3f4ab5.frames)
    ? _0x3f4ab5.frames.map(normalizeFrameItem).filter((_0x16ddfe) => _0x16ddfe.url || _0x16ddfe.localPath)
    : [];
  if (_0x54fbdc.length === 0) throw new Error('视频分镜抽帧没有返回可用参考帧');
  return { ..._0x3f4ab5, frames: _0x54fbdc };
}
export const STORYBOARD_VIDEO_FRAME_LIMIT = STORYBOARD_VIDEO_FRAME_MAX_COUNT;
