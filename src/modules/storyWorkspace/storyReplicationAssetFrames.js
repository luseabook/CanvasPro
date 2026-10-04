import { captureStoryReplicationRepresentativeFrame } from './storyReplicationRepresentativeFrames.js';
export async function collectStoryReplicationAssetFrames({
  data: data,
  assets: assets,
  projectId: projectId,
  sources: sources,
  isActive: isActive = () => !![],
  onProgress: onProgress,
  capture: capture = captureStoryReplicationRepresentativeFrame,
}) {
  const list = assets['filter'](
      (value) => ['scene', 'prop']['includes'](value['kind']) && value['replicationSource']?.['episodeId'],
    ),
    map = new Map(),
    list2 = [];
  for (const [item, key] of list['entries']()) {
    if (!isActive()) return ![];
    const timeSec = key['replicationSource'],
      index = data['episodes']['find']((result) => result['id'] === timeSec['episodeId']),
      options = index?.['replication']?.['sourceAnalysis'],
      target = options?.['revision'],
      enabled = sources?.['find']((source) => source['episodeId'] === timeSec['episodeId']);
    if (sources && (!enabled || enabled['revision'] !== target)) return ![];
    const videoRef = index?.['sourceVideo']?.['videoRef'],
      isActive2 = () =>
        isActive() &&
        index?.['replication']?.['sourceAnalysis'] === options &&
        options?.['revision'] === target &&
        index?.['sourceVideo']?.['videoRef'] === videoRef;
    (list2['push'](isActive2),
      onProgress?.(
        '正在提取' +
          (key['kind'] === 'scene' ? '场景' : '道具') +
          '原片截图 ' +
          (item + 0x1) +
          '/' +
          list['length'],
      ));
    try {
      if (!videoRef) throw new Error('原视频不可用，请重新导入后提取素材。');
      const next = timeSec['episodeId'] + ':' + timeSec['representativeTimeSec'],
        args =
          map['get'](next) ||
          (await capture({
            videoRef: videoRef,
            timeSec: timeSec['representativeTimeSec'],
            projectId: projectId,
            isActive: isActive2,
          }));
      if (!isActive2()) return ![];
      if (!args) throw new Error('原片截图未保存，请重新提取素材。');
      (map['set'](next, args), (timeSec['frame'] = { ...args }), (timeSec['frameError'] = ''));
    } catch (error) {
      if (!isActive2()) return ![];
      timeSec['frameError'] = error?.['message'] || '原片截图失败，请重新提取素材。';
    }
  }
  return isActive() && list2['every']((handler) => handler());
}
