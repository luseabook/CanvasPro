import { captureStoryClipFrameFromSource } from './storyClipFrameCapture.js';
import { saveVideoFrameSnapshot } from '../../components/videoFrameCapture.js';
import { uploadFile } from '../../services/projectService.js';
export async function captureStoryReplicationRepresentativeFrame({
  videoRef: _0x2197df,
  timeSec: _0x366f50,
  projectId: _0x398850,
  crop: _0x8266d1,
  isActive: isActive = () => !![],
  capture: capture = captureStoryClipFrameFromSource,
  save: save = uploadFile,
} = {}) {
  const _0x3c2fad = await capture({
    sourceUrl: _0x2197df,
    currentTimeSec: _0x366f50,
    fileNamePrefix: 'story_source_character',
    crop: _0x8266d1,
  });
  if (!isActive()) return null;
  const _0x317422 = await saveVideoFrameSnapshot(_0x3c2fad, (_0x17d142) => save(_0x17d142, _0x398850));
  if (!isActive()) return null;
  return {
    url: _0x317422['src'],
    localPath: _0x317422['localPath'],
    timeSec: _0x366f50,
    ...(_0x8266d1 ? { crop: { ..._0x8266d1 }, width: _0x3c2fad['width'], height: _0x3c2fad['height'] } : {}),
  };
}
export async function collectStoryReplicationRepresentativeFrames({
  episode: _0x44005a,
  projectId: _0x2ad9fc,
  isActive: isActive = () => !![],
  onProgress: _0x3c8359,
  capture: capture = captureStoryReplicationRepresentativeFrame,
} = {}) {
  const _0xb921d1 = _0x44005a['replication']['sourceAnalysis'];
  for (const [_0x985f7, _0x252ead] of _0xb921d1['characters']['entries']()) {
    if (!isActive() || _0x44005a['replication']['sourceAnalysis'] !== _0xb921d1) return;
    if (_0x252ead['frame']?.['localPath']) continue;
    _0x3c8359?.('正在提取人物代表画面 ' + (_0x985f7 + 0x1) + '/' + _0xb921d1['characters']['length']);
    try {
      const _0x4e5b5f = await capture({
        videoRef: _0x44005a['sourceVideo']['videoRef'],
        timeSec: _0x252ead['representativeTimeSec'],
        projectId: _0x2ad9fc,
        isActive: () => isActive() && _0x44005a['replication']['sourceAnalysis'] === _0xb921d1,
      });
      if (!isActive() || _0x44005a['replication']['sourceAnalysis'] !== _0xb921d1) return;
      _0x4e5b5f && ((_0x252ead['frame'] = _0x4e5b5f), (_0x252ead['frameError'] = ''));
    } catch (_0x149eb7) {
      if (!isActive() || _0x44005a['replication']['sourceAnalysis'] !== _0xb921d1) return;
      _0x252ead['frameError'] = _0x149eb7?.['message'] || '代表画面提取失败，可播放原片后重新截帧。';
    }
  }
}
