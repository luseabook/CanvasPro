import { replicationSpeechParts } from './videoReplicationSpeechIntegrity.js';
import { findReplicationAsrSpeechRange } from './videoReplicationSpeechOrder.js';
export { findReplicationAsrSpeechRange } from './videoReplicationSpeechOrder.js';
export function resolveReplicationSpeechTiming({
  clip: clip,
  shot: shot,
  kind: kind,
  parts: parts,
  durationSec: durationSec,
}) {
  const value = parts['map']((item) => item['text'])['join'](''),
    key = Number(clip['sourceStartSec'] || 0),
    index =
      parts['length'] === 1
        ? findReplicationAsrSpeechRange(clip['replicationSpeechEvents'] || [], kind, value)
        : null;
  if (index)
    return {
      startSec: Math['max'](0, index['startSec'] - key),
      endSec: Math['min'](durationSec, index['endSec'] - key),
    };
  const result = (clip['replicationSpeechEvents'] || [])['flatMap']((data) => {
      const list = data[kind] || [];
      return list['flatMap']((options, target) => {
        let source = '';
        for (let next = target; next < list['length']; next++) {
          source += list[next]['text'] || '';
          if (value && source === value)
            return [
              {
                event: data,
                refs: list['slice'](target, next + 1)['map'](
                  (current, entry) => kind + ':' + (target + entry),
                ),
              },
            ];
          if (source['length'] >= value['length']) break;
        }
        return [];
      });
    }),
    record = result['length'] === 1 ? result[0] : null,
    enabled = record?.['event'],
    handler = (payload) =>
      payload &&
      Number['isFinite'](payload['startSec']) &&
      Number['isFinite'](payload['endSec']) &&
      payload['startSec'] >= shot['startSec'] &&
      payload['startSec'] < shot['endSec'] &&
      payload['endSec'] > payload['startSec'] &&
      payload['endSec'] <= durationSec,
    handle = new Set(record?.['refs'] || []),
    args = record?.['refs']['map']((state) => enabled[kind][Number(state['split'](':')[1])]) || [];
  if (args['length'] && args['every']((config) => config['timingSource'] === 'asr'))
    return {
      startSec: Math['max'](0, Math['min'](...args['map']((scope) => scope['startSec'])) - key),
      endSec: Math['min'](durationSec, Math['max'](...args['map']((input) => input['endSec'])) - key),
    };
  const args2 = (enabled?.['shots'] || [])['filter']((output) =>
      output['speechRefs']?.['some']((value2) => handle['has'](value2)),
    ),
    value3 = kind === 'voiceover' ? 'dialogue' : 'voiceover',
    value4 = args2['length']
      ? {
          startSec: Math['min'](...args2['map']((value5) => value5['startSec'])) - key,
          endSec: Math['max'](...args2['map']((value6) => value6['endSec'])) - key,
        }
      : enabled &&
          handle['size'] === enabled[kind]?.['length'] &&
          !enabled[value3]?.['length'] &&
          !enabled['shots']?.['length']
        ? { startSec: enabled['startSec'] - key, endSec: enabled['endSec'] - key }
        : null,
    args3 =
      kind === 'voiceover' &&
      String(shot['audio'] || '')['match'](/画外音时间[：:]\s*(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)秒?/u),
    value7 = args3 && { startSec: Number(args3[1]), endSec: Number(args3[2]) };
  if (handler(value4))
    return handler(value7) && value7['startSec'] >= value4['startSec'] && value7['endSec'] <= value4['endSec']
      ? value7
      : value4;
  if (handler(value7)) return value7;
  return {
    startSec: shot['startSec'],
    endSec: shot['endSec'],
    ...(args3 || /(?:延续|继续|接续)/u['test'](shot['audio'] || '') ? { uncertain: !![] } : {}),
  };
}
export function inspectReplicationSpeechTiming({ clips: clips = [] } = {}, value8 = {}) {
  return clips['flatMap']((args4) => {
    const value9 = value8['replication']?.['segmentPlan']?.['find'](
      (value10) => value10['ref'] === args4['ref'],
    )?.['events'];
    let value11 = 0;
    const value12 = (args4['shots'] || [])['map']((args5) => ({
      ...args5,
      startSec: value11,
      endSec: (value11 += Number(args5['durationSec'])),
    }));
    return value12['flatMap']((value13, value14) =>
      ['voiceover', 'dialogue']['flatMap']((value15) => {
        const replicationSpeechParts2 = replicationSpeechParts(value13[value15], value15);
        if (!replicationSpeechParts2['length']) return [];
        const replicationSpeechTiming = resolveReplicationSpeechTiming({
          clip: { ...args4, replicationSpeechEvents: value9 || args4['replicationSpeechEvents'] },
          shot: value13,
          kind: value15,
          parts: replicationSpeechParts2,
          durationSec: value11,
        });
        return replicationSpeechTiming['uncertain']
          ? [
              {
                clipRef: args4['ref'],
                shotIndex: value14,
                code: 'replication_speech_timing_uncertain',
                message: '人声覆盖时间无法从原片证据定位，暂保留当前镜头范围，请核对声音时间。',
              },
            ]
          : [];
      }),
    );
  });
}
