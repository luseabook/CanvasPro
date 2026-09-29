import { desktopBridge } from '../../services/desktopBridge.js';
import { normalizeLocalPath } from '../../utils/localMediaPath.js';
export const PERSON_REPLACEMENT_TIMELINE_MODES = Object['freeze']({
  PREMIERE: 'premiere-xml',
  JIANYING: 'jianying-draft',
});
export function isPersonReplacementTimelineMode(_0x446d69) {
  return Object['values'](PERSON_REPLACEMENT_TIMELINE_MODES)['includes'](_0x446d69);
}
export function getPersonReplacementTimelineExportNotice(_0x3e685e, _0x569bb2 = {}) {
  if (_0x3e685e !== PERSON_REPLACEMENT_TIMELINE_MODES['JIANYING'])
    return { message: 'Premiere 工程已导出，请在 PR 中导入 timeline.xml。', type: 'success' };
  if (_0x569bb2['jianyingLaunch'] === 'failed')
    return { message: _0x569bb2['jianyingLaunchError'] || '草稿已保存，请手动打开剪映。', type: 'info' };
  if (_0x569bb2['jianyingLaunch'] === 'opened')
    return { message: '草稿已保存，剪映已打开，请在草稿列表中查看。', type: 'success' };
  return {
    message: _0x569bb2['autoDetected']
      ? '剪映草稿已保存到本机草稿目录，请刷新列表或重启剪映。'
      : '剪映草稿已导出，请在所选草稿位置刷新列表或重启剪映。',
    type: 'success',
  };
}
export function buildPersonReplacementTimelineRequest(_0x58ee97 = {}, _0x14255f) {
  if (!isPersonReplacementTimelineMode(_0x14255f)) throw new Error('不支持的剪辑工程格式');
  const _0x4a2f87 = Array['isArray'](_0x58ee97['shots']) ? _0x58ee97['shots'] : [];
  if (!_0x4a2f87['length']) throw new Error('当前项目没有可导出的镜头');
  const _0x40ddef = [],
    _0x1904a6 = new Map(),
    _0x3c9fa6 = (_0x10ceb5, _0x41685d) => {
      if (!_0x10ceb5) return '';
      const _0xce7e75 = normalizeLocalPath(_0x10ceb5);
      if (!_0xce7e75) throw new Error(_0x41685d + '尚未保存到本地，请先完成素材下载');
      if (!_0x1904a6['has'](_0xce7e75)) {
        const _0x12d97f = 'media-' + (_0x40ddef['length'] + 0x1);
        (_0x1904a6['set'](_0xce7e75, _0x12d97f),
          _0x40ddef['push']({ id: _0x12d97f, localPath: _0xce7e75, name: _0x41685d }));
      }
      return _0x1904a6['get'](_0xce7e75);
    },
    _0x3766e4 = _0x58ee97['audio']?.['previewTrack'] === 'original' ? 0x0 : 0x1,
    _0x5e6362 = [
      { type: 'video', name: '原视频片段', muted: ![], clips: [] },
      { type: 'video', name: '替换视频片段', muted: ![], clips: [] },
      { type: 'audio', name: '原视频音频片段', muted: _0x3766e4 !== 0x0, clips: [] },
      { type: 'audio', name: '替换视频音频片段', muted: _0x3766e4 !== 0x1, clips: [] },
    ],
    _0x1d453f = new Map((_0x58ee97['sources'] || [])['map']((_0x38a179) => [_0x38a179['id'], _0x38a179])),
    _0x3b7a4d = _0x4a2f87['map']((_0x44b1ab, _0x2ddbe4) => {
      const _0x16a7fe = '镜头' + String(_0x2ddbe4 + 0x1)['padStart'](0x2, '0'),
        _0x28b06c =
          _0x44b1ab['sourceVideoRef'] || _0x1d453f['get'](_0x44b1ab['sourceId'])?.['videoRef'] || '',
        _0x5e5a00 = _0x44b1ab['videoRef'] || _0x28b06c;
      if (_0x5e5a00 && _0x44b1ab['isReversed'] && !_0x44b1ab['materializedIsReversed'])
        throw new Error(_0x16a7fe + '的原片倒放尚未完成，请先完成片段处理');
      const _0x2d378b = _0x3c9fa6(_0x5e5a00, _0x16a7fe + '-原视频'),
        _0x40feb4 = _0x3c9fa6(_0x44b1ab['resultVideoRef'], _0x16a7fe + '-替换视频'),
        _0x2ee9e3 =
          !_0x44b1ab['videoRef'] || _0x44b1ab['videoRef'] === _0x28b06c
            ? Math['max'](0x0, Number(_0x44b1ab['startTimeSec']) || 0x0)
            : 0x0,
        _0x51eecd = Math['max'](
          0x0,
          Number(_0x44b1ab['durationSec']) ||
            Number(_0x44b1ab['endTimeSec']) - Number(_0x44b1ab['startTimeSec']) ||
            0x0,
        );
      if (_0x2d378b) {
        const _0x12ebf5 = {
          slot: _0x2ddbe4,
          mediaId: _0x2d378b,
          name: _0x16a7fe,
          sourceStartSec: _0x2ee9e3,
          ...(_0x51eecd > 0x0 ? { sourceDurationSec: _0x51eecd } : {}),
        };
        (_0x5e6362[0x0]['clips']['push'](_0x12ebf5), _0x5e6362[0x2]['clips']['push']({ ..._0x12ebf5 }));
      }
      if (_0x40feb4) {
        const _0x290a61 = { slot: _0x2ddbe4, mediaId: _0x40feb4, name: _0x16a7fe, sourceStartSec: 0x0 };
        (_0x5e6362[0x1]['clips']['push'](_0x290a61), _0x5e6362[0x3]['clips']['push']({ ..._0x290a61 }));
      }
      return _0x2d378b
        ? {
            durationMediaId: _0x2d378b,
            sourceStartSec: _0x2ee9e3,
            ...(_0x51eecd > 0x0 ? { durationSec: _0x51eecd } : {}),
          }
        : _0x40feb4
          ? { durationMediaId: _0x40feb4 }
          : { durationSec: _0x51eecd };
    });
  if (!_0x40ddef['length']) throw new Error('当前项目没有可导出的本地视频');
  return {
    format: _0x14255f,
    name: _0x58ee97['title'] || '替换工作室',
    media: _0x40ddef,
    slots: _0x3b7a4d,
    tracks: _0x5e6362,
  };
}
export async function exportPersonReplacementTimeline({
  project: _0x33f596,
  mode: _0x1874d4,
  saveTimeline: saveTimeline = (_0x57d0cd) => desktopBridge['nodeExport']['saveTimeline'](_0x57d0cd),
}) {
  return saveTimeline(buildPersonReplacementTimelineRequest(_0x33f596, _0x1874d4));
}
