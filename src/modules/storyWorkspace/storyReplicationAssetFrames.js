import { captureStoryReplicationRepresentativeFrame } from './storyReplicationRepresentativeFrames.js';
export async function collectStoryReplicationAssetFrames({
  data: _0x174a75,
  assets: _0x37b51d,
  projectId: _0x44dbb4,
  sources: _0x3659c7,
  isActive: isActive = () => !![],
  onProgress: _0x368a2a,
  capture: capture = captureStoryReplicationRepresentativeFrame,
}) {
  const _0x246a42 = _0x37b51d['filter'](
      (_0x19d283) =>
        ['scene', 'prop']['includes'](_0x19d283['kind']) && _0x19d283['replicationSource']?.['episodeId'],
    ),
    _0x4963d3 = new Map(),
    _0x369675 = [];
  for (const [_0x156117, _0x545cdd] of _0x246a42['entries']()) {
    if (!isActive()) return ![];
    const _0x5ace47 = _0x545cdd['replicationSource'],
      _0x4714ed = _0x174a75['episodes']['find']((_0x12d8ed) => _0x12d8ed['id'] === _0x5ace47['episodeId']),
      _0x1d21be = _0x4714ed?.['replication']?.['sourceAnalysis'],
      _0x4221b8 = _0x1d21be?.['revision'],
      _0x5b5fbe = _0x3659c7?.['find']((_0x29a8d6) => _0x29a8d6['episodeId'] === _0x5ace47['episodeId']);
    if (_0x3659c7 && (!_0x5b5fbe || _0x5b5fbe['revision'] !== _0x4221b8)) return ![];
    const _0x2bf788 = _0x4714ed?.['sourceVideo']?.['videoRef'],
      _0x427ad9 = () =>
        isActive() &&
        _0x4714ed?.['replication']?.['sourceAnalysis'] === _0x1d21be &&
        _0x1d21be?.['revision'] === _0x4221b8 &&
        _0x4714ed?.['sourceVideo']?.['videoRef'] === _0x2bf788;
    (_0x369675['push'](_0x427ad9),
      _0x368a2a?.(
        '正在提取' +
          (_0x545cdd['kind'] === 'scene' ? '场景' : '道具') +
          '原片截图 ' +
          (_0x156117 + 0x1) +
          '/' +
          _0x246a42['length'],
      ));
    try {
      if (!_0x2bf788) throw new Error('原视频不可用，请重新导入后提取素材。');
      const _0x48097e = _0x5ace47['episodeId'] + ':' + _0x5ace47['representativeTimeSec'],
        _0x4b61c1 =
          _0x4963d3['get'](_0x48097e) ||
          (await capture({
            videoRef: _0x2bf788,
            timeSec: _0x5ace47['representativeTimeSec'],
            projectId: _0x44dbb4,
            isActive: _0x427ad9,
          }));
      if (!_0x427ad9()) return ![];
      if (!_0x4b61c1) throw new Error('原片截图未保存，请重新提取素材。');
      (_0x4963d3['set'](_0x48097e, _0x4b61c1),
        (_0x5ace47['frame'] = { ..._0x4b61c1 }),
        (_0x5ace47['frameError'] = ''));
    } catch (_0x598bf7) {
      if (!_0x427ad9()) return ![];
      _0x5ace47['frameError'] = _0x598bf7?.['message'] || '原片截图失败，请重新提取素材。';
    }
  }
  return isActive() && _0x369675['every']((_0x2a9c3a) => _0x2a9c3a());
}
