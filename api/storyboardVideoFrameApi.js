import { post } from './apiBase.js';
const STORYBOARD_VIDEO_FRAME_MAX_COUNT = 100,
  STORYBOARD_VIDEO_FRAME_TIMEOUT_MS = 300000;
function normalizeFrameCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count) || count <= 0) return STORYBOARD_VIDEO_FRAME_MAX_COUNT;
  return Math.max(1, Math.min(STORYBOARD_VIDEO_FRAME_MAX_COUNT, Math.trunc(count)));
}
function normalizeFrameItem(response, item) {
  const url = String(response?.url || response?.localUrl || '').trim(),
    localPath = String(response?.localPath || response?.path || '').trim();
  return {
    index: Number(response?.index) || item + 1,
    start: Number(response?.start) || 0,
    end: Number(response?.end) || 0,
    duration: Number(response?.duration) || 0,
    captureTime: Number(response?.captureTime) || 0,
    url: url,
    localPath: localPath,
  };
}
export async function extractStoryboardVideoFramesFromServer(
  key,
  { maxFrames: maxFrames = STORYBOARD_VIDEO_FRAME_MAX_COUNT, exactCount: exactCount = false } = {},
) {
  const src = String(key || '').trim();
  if (!src) throw new Error('视频源不能为空');
  const response2 = await post(
    '/api/v2/video/storyboard_frames',
    {
      src: src,
      options: { maxFrames: normalizeFrameCount(maxFrames), exactCount: exactCount === true },
    },
    STORYBOARD_VIDEO_FRAME_TIMEOUT_MS,
  );
  if (!response2.success) throw new Error(response2.error || '视频分镜抽帧失败');
  const response3 = response2.data || {};
  if (response3.success === false) throw new Error(response3.error || '视频分镜抽帧失败');
  const frames = Array.isArray(response3.frames)
    ? response3.frames.map(normalizeFrameItem).filter((response4) => response4.url || response4.localPath)
    : [];
  if (frames.length === 0) throw new Error('视频分镜抽帧没有返回可用参考帧');
  return { ...response3, frames: frames };
}
export const STORYBOARD_VIDEO_FRAME_LIMIT = STORYBOARD_VIDEO_FRAME_MAX_COUNT;
