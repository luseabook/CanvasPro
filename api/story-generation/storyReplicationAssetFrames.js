import { parseStrictJson } from '../utils/strictJson.js';
import { getResultText } from './storyTextRequest.js';
export function addReplicationAssetFrameContract(value, enabled) {
  if (!enabled['replicationFrameSources']?.['length']) return value;
  ((value['sourceVideos'] = enabled['replicationFrameSources']),
    value['requirements']['push'](
      '每个场景、道具必须返回 sourceFrame：episodeId 为 sourceVideos 中的视频 id，eventId 为实际展示该素材的事件 id，timeSec 为该事件范围内的原片绝对秒数。选择描述中素材清晰可见的时刻，不能用对白提及代替画面出场；无法确定时返回 null，不得猜造时间或裁剪坐标。此时间用于截取原片作为替换前对比，不是生成的新图。',
    ));
  if (value['outputSchema']?.['assets']?.[0])
    value['outputSchema']['assets'][0]['sourceFrame'] = {
      episodeId: '来源视频 id',
      eventId: '出场事件 id',
      timeSec: '代表画面的绝对秒数；无法确定返回 null',
    };
  return value;
}
export function addReplicationAssetFrameSchema(item, enabled2) {
  if (!enabled2['replicationFrameSources']?.['length']) return item;
  const key = item['properties']['assets']['items'];
  return (
    key['required']['push']('sourceFrame'),
    (key['properties']['sourceFrame'] = {
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          additionalProperties: ![],
          required: ['episodeId', 'eventId', 'timeSec'],
          properties: {
            episodeId: { type: 'string' },
            eventId: { type: 'string' },
            timeSec: { type: 'number', minimum: 0 },
          },
        },
      ],
    }),
    item
  );
}
export function attachReplicationAssetFrames(index, result, enabled3) {
  if (!enabled3['replicationFrameSources']?.['length']) return index;
  const strictJson = parseStrictJson(getResultText(result));
  for (const name of index['assets']) {
    if (!['scene', 'prop']['includes'](name['kind'])) continue;
    const list = (strictJson['assets'] || [])['filter'](
        (data) => data['ref'] === name['ref'] && data['kind'] === name['kind'],
      ),
      options = list['length'] === 1 ? list[0]['sourceFrame'] : undefined;
    if (options === undefined) throw new Error('场景或道具缺少原片代表画面信息，请重新提取素材。');
    if (options === null) {
      name['replicationSource'] = {
        name: name['name'],
        ref: name['ref'],
        frameError: '未能确定原片出场画面',
      };
      continue;
    }
    const episodeId = enabled3['replicationFrameSources']['find'](
        (target) => target['episodeId'] === options['episodeId'],
      ),
      eventId = episodeId?.['events']['find']((source) => source['id'] === options['eventId']),
      representativeTimeSec = options['timeSec'];
    if (
      !eventId ||
      typeof representativeTimeSec !== 'number' ||
      !Number['isFinite'](representativeTimeSec) ||
      representativeTimeSec < eventId['startSec'] ||
      representativeTimeSec >= eventId['endSec'] ||
      (episodeId['durationSec'] > 0 && representativeTimeSec >= episodeId['durationSec']) ||
      !name['sourceChapterIds']['includes'](episodeId['episodeId'])
    )
      throw new Error('场景或道具的原片代表时间不属于其来源视频或出场片段，请重新提取素材。');
    name['replicationSource'] = {
      name: name['name'],
      ref: name['ref'],
      episodeId: episodeId['episodeId'],
      eventId: eventId['id'],
      representativeTimeSec: representativeTimeSec,
    };
  }
  return index;
}
