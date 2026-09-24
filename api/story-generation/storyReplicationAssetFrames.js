import { parseStrictJson } from '../utils/strictJson.js';
import { getResultText } from './storyTextRequest.js';
export function addReplicationAssetFrameContract(_0x22fa22, _0x472c48) {
  if (!_0x472c48['replicationFrameSources']?.['length']) return _0x22fa22;
  ((_0x22fa22['sourceVideos'] = _0x472c48['replicationFrameSources']),
    _0x22fa22['requirements']['push'](
      '每个场景、道具必须返回 sourceFrame：episodeId 为 sourceVideos 中的视频 id，eventId 为实际展示该素材的事件 id，timeSec 为该事件范围内的原片绝对秒数。选择描述中素材清晰可见的时刻，不能用对白提及代替画面出场；无法确定时返回 null，不得猜造时间或裁剪坐标。此时间用于截取原片作为替换前对比，不是生成的新图。',
    ));
  if (_0x22fa22['outputSchema']?.['assets']?.[0x0])
    _0x22fa22['outputSchema']['assets'][0x0]['sourceFrame'] = {
      episodeId: '来源视频 id',
      eventId: '出场事件 id',
      timeSec: '代表画面的绝对秒数；无法确定返回 null',
    };
  return _0x22fa22;
}
export function addReplicationAssetFrameSchema(_0x58a492, _0x365c82) {
  if (!_0x365c82['replicationFrameSources']?.['length']) return _0x58a492;
  const _0x4f6ecc = _0x58a492['properties']['assets']['items'];
  return (
    _0x4f6ecc['required']['push']('sourceFrame'),
    (_0x4f6ecc['properties']['sourceFrame'] = {
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          additionalProperties: ![],
          required: ['episodeId', 'eventId', 'timeSec'],
          properties: {
            episodeId: { type: 'string' },
            eventId: { type: 'string' },
            timeSec: { type: 'number', minimum: 0x0 },
          },
        },
      ],
    }),
    _0x58a492
  );
}
export function attachReplicationAssetFrames(_0x3daa2e, _0x2d2c3b, _0x2425bb) {
  if (!_0x2425bb['replicationFrameSources']?.['length']) return _0x3daa2e;
  const _0x55425a = parseStrictJson(getResultText(_0x2d2c3b));
  for (const _0x2e2905 of _0x3daa2e['assets']) {
    if (!['scene', 'prop']['includes'](_0x2e2905['kind'])) continue;
    const _0x260fd5 = (_0x55425a['assets'] || [])['filter'](
        (_0x1ac0a1) => _0x1ac0a1['ref'] === _0x2e2905['ref'] && _0x1ac0a1['kind'] === _0x2e2905['kind'],
      ),
      _0x1a076b = _0x260fd5['length'] === 0x1 ? _0x260fd5[0x0]['sourceFrame'] : undefined;
    if (_0x1a076b === undefined) throw new Error('场景或道具缺少原片代表画面信息，请重新提取素材。');
    if (_0x1a076b === null) {
      _0x2e2905['replicationSource'] = {
        name: _0x2e2905['name'],
        ref: _0x2e2905['ref'],
        frameError: '未能确定原片出场画面',
      };
      continue;
    }
    const _0x5374e2 = _0x2425bb['replicationFrameSources']['find'](
        (_0x86b660) => _0x86b660['episodeId'] === _0x1a076b['episodeId'],
      ),
      _0x3dd9e9 = _0x5374e2?.['events']['find']((_0x9c4177) => _0x9c4177['id'] === _0x1a076b['eventId']),
      _0x2fa5f8 = _0x1a076b['timeSec'];
    if (
      !_0x3dd9e9 ||
      typeof _0x2fa5f8 !== 'number' ||
      !Number['isFinite'](_0x2fa5f8) ||
      _0x2fa5f8 < _0x3dd9e9['startSec'] ||
      _0x2fa5f8 >= _0x3dd9e9['endSec'] ||
      (_0x5374e2['durationSec'] > 0x0 && _0x2fa5f8 >= _0x5374e2['durationSec']) ||
      !_0x2e2905['sourceChapterIds']['includes'](_0x5374e2['episodeId'])
    )
      throw new Error('场景或道具的原片代表时间不属于其来源视频或出场片段，请重新提取素材。');
    _0x2e2905['replicationSource'] = {
      name: _0x2e2905['name'],
      ref: _0x2e2905['ref'],
      episodeId: _0x5374e2['episodeId'],
      eventId: _0x3dd9e9['id'],
      representativeTimeSec: _0x2fa5f8,
    };
  }
  return _0x3daa2e;
}
