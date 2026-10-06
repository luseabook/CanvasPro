import { desktopBridge } from '../../services/desktopBridge.js';
import { normalizeLocalPath } from '../../utils/localMediaPath.js';
export const PERSON_REPLACEMENT_TIMELINE_MODES = Object.freeze({
  PREMIERE: 'premiere-xml',
  JIANYING: 'jianying-draft',
});
export function isPersonReplacementTimelineMode(value) {
  return Object.values(PERSON_REPLACEMENT_TIMELINE_MODES).includes(value);
}
export function getPersonReplacementTimelineExportNotice(item, message = {}) {
  if (item !== PERSON_REPLACEMENT_TIMELINE_MODES.JIANYING)
    return { message: 'Premiere 工程已导出，请在 PR 中导入 timeline.xml。', type: 'success' };
  if (message.jianyingLaunch === 'failed')
    return { message: message.jianyingLaunchError || '草稿已保存，请手动打开剪映。', type: 'info' };
  if (message.jianyingLaunch === 'opened')
    return { message: '草稿已保存，剪映已打开，请在草稿列表中查看。', type: 'success' };
  return {
    message: message.autoDetected
      ? '剪映草稿已保存到本机草稿目录，请刷新列表或重启剪映。'
      : '剪映草稿已导出，请在所选草稿位置刷新列表或重启剪映。',
    type: 'success',
  };
}
export function buildPersonReplacementTimelineRequest(name = {}, format) {
  if (!isPersonReplacementTimelineMode(format)) throw new Error('不支持的剪辑工程格式');
  const list = Array.isArray(name.shots) ? name.shots : [];
  if (!list.length) throw new Error('当前项目没有可导出的镜头');
  const media = [],
    map = new Map(),
    handler = (enabled, name2) => {
      if (!enabled) return '';
      const localPath = normalizeLocalPath(enabled);
      if (!localPath) throw new Error(name2 + '尚未保存到本地，请先完成素材下载');
      if (!map.has(localPath)) {
        const id = 'media-' + (media.length + 1);
        (map.set(localPath, id), media.push({ id: id, localPath: localPath, name: name2 }));
      }
      return map.get(localPath);
    },
    muted = name.audio?.previewTrack === 'original' ? 0 : 1,
    tracks = [
      { type: 'video', name: '原视频片段', muted: false, clips: [] },
      { type: 'video', name: '替换视频片段', muted: false, clips: [] },
      { type: 'audio', name: '原视频音频片段', muted: muted !== 0, clips: [] },
      { type: 'audio', name: '替换视频音频片段', muted: muted !== 1, clips: [] },
    ],
    map2 = new Map((name.sources || []).map((key) => [key.id, key])),
    slots = list.map((enabled2, slot) => {
      const name3 = '镜头' + String(slot + 1).padStart(2, '0'),
        index = enabled2.sourceVideoRef || map2.get(enabled2.sourceId)?.videoRef || '',
        result = enabled2.videoRef || index;
      if (result && enabled2.isReversed && !enabled2.materializedIsReversed)
        throw new Error(name3 + '的原片倒放尚未完成，请先完成片段处理');
      const mediaId = handler(result, name3 + '-原视频'),
        mediaId2 = handler(enabled2.resultVideoRef, name3 + '-替换视频'),
        sourceStartSec =
          !enabled2.videoRef || enabled2.videoRef === index
            ? Math.max(0, Number(enabled2.startTimeSec) || 0)
            : 0,
        sourceDurationSec = Math.max(
          0,
          Number(enabled2.durationSec) ||
            Number(enabled2.endTimeSec) - Number(enabled2.startTimeSec) ||
            0,
        );
      if (mediaId) {
        const args = {
          slot: slot,
          mediaId: mediaId,
          name: name3,
          sourceStartSec: sourceStartSec,
          ...(sourceDurationSec > 0 ? { sourceDurationSec: sourceDurationSec } : {}),
        };
        (tracks[0].clips.push(args), tracks[2].clips.push({ ...args }));
      }
      if (mediaId2) {
        const args2 = { slot: slot, mediaId: mediaId2, name: name3, sourceStartSec: 0 };
        (tracks[1].clips.push(args2), tracks[3].clips.push({ ...args2 }));
      }
      return mediaId
        ? {
            durationMediaId: mediaId,
            sourceStartSec: sourceStartSec,
            ...(sourceDurationSec > 0 ? { durationSec: sourceDurationSec } : {}),
          }
        : mediaId2
          ? { durationMediaId: mediaId2 }
          : { durationSec: sourceDurationSec };
    });
  if (!media.length) throw new Error('当前项目没有可导出的本地视频');
  return {
    format: format,
    name: name.title || '替换工作室',
    media: media,
    slots: slots,
    tracks: tracks,
  };
}
export async function exportPersonReplacementTimeline({
  project: project,
  mode: mode,
  saveTimeline: saveTimeline = (data) => desktopBridge.nodeExport.saveTimeline(data),
}) {
  return saveTimeline(buildPersonReplacementTimelineRequest(project, mode));
}
