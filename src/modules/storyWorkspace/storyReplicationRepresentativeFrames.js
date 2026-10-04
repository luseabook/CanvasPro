import { captureStoryClipFrameFromSource } from './storyClipFrameCapture.js';
import { saveVideoFrameSnapshot } from '../../components/videoFrameCapture.js';
import { uploadFile } from '../../services/projectService.js';
export async function captureStoryReplicationRepresentativeFrame({
  videoRef: videoRef,
  timeSec: timeSec,
  projectId: projectId,
  crop: crop,
  isActive: isActive = () => !![],
  capture: capture = captureStoryClipFrameFromSource,
  save: save = uploadFile,
} = {}) {
  const width = await capture({
    sourceUrl: videoRef,
    currentTimeSec: timeSec,
    fileNamePrefix: 'story_source_character',
    crop: crop,
  });
  if (!isActive()) return null;
  const url = await saveVideoFrameSnapshot(width, (value) => save(value, projectId));
  if (!isActive()) return null;
  return {
    url: url['src'],
    localPath: url['localPath'],
    timeSec: timeSec,
    ...(crop ? { crop: { ...crop }, width: width['width'], height: width['height'] } : {}),
  };
}
export async function collectStoryReplicationRepresentativeFrames({
  episode: episode,
  projectId: projectId2,
  isActive: isActive = () => !![],
  onProgress: onProgress,
  capture: capture = captureStoryReplicationRepresentativeFrame,
} = {}) {
  const item = episode['replication']['sourceAnalysis'];
  for (const [key, timeSec2] of item['characters']['entries']()) {
    if (!isActive() || episode['replication']['sourceAnalysis'] !== item) return;
    if (timeSec2['frame']?.['localPath']) continue;
    onProgress?.('正在提取人物代表画面 ' + (key + 0x1) + '/' + item['characters']['length']);
    try {
      const capture2 = await capture({
        videoRef: episode['sourceVideo']['videoRef'],
        timeSec: timeSec2['representativeTimeSec'],
        projectId: projectId2,
        isActive: () => isActive() && episode['replication']['sourceAnalysis'] === item,
      });
      if (!isActive() || episode['replication']['sourceAnalysis'] !== item) return;
      capture2 && ((timeSec2['frame'] = capture2), (timeSec2['frameError'] = ''));
    } catch (error) {
      if (!isActive() || episode['replication']['sourceAnalysis'] !== item) return;
      timeSec2['frameError'] = error?.['message'] || '代表画面提取失败，可播放原片后重新截帧。';
    }
  }
}
