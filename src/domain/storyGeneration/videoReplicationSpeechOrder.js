const kinds = ['voiceover', 'dialogue'];
export function getReplicationEventSpeech(value) {
  const list = kinds['flatMap']((kind) =>
    (value[kind] || [])['map']((args, item) => ({
      ...args,
      kind: kind,
      key: kind + ':' + item,
    })),
  );
  if (value['speechOrder']?.['length']) {
    const list2 = value['speechOrder']['map']((key) => list['find']((event) => event['key'] === key));
    if (
      list2['length'] !== list['length'] ||
      list2['some']((enabled) => !enabled) ||
      new Set(value['speechOrder'])['size'] !== list['length']
    )
      return null;
    return list2;
  }
  if (
    !list['some']((index) => index['kind'] === 'dialogue') ||
    !list['some']((result) => result['kind'] === 'voiceover')
  )
    return list;
  const list3 = list['filter']((data) => data['kind'] === 'voiceover'),
    list4 = list['filter']((options) => options['kind'] === 'dialogue');
  if (list3['length'] !== 0x1 || list['some']((response) => response['uncertain'] || !response['text']))
    return null;
  const list5 = [...String(value['sound'] || '')['matchAll'](/“([^”]+)”/gu)]['flatMap']((target) => {
    const index2 = target[0x1],
      list6 = list4['map']((part) => ({
        part: part,
        index: index2['indexOf'](part['text']),
      }));
    if (
      list6['some'](
        ({ part: part2, index: index3 }) =>
          index3 < 0x0 || index2['indexOf'](part2['text'], index3 + 0x1) >= 0x0,
      )
    )
      return [];
    list6['sort']((source, next) => source['index'] - next['index']);
    const list7 = [];
    let current = 0x0;
    for (const { part: part3, index: index4 } of list6) {
      if (index4 < current) return [];
      if (index4 > current) list7['push']({ ...list3[0x0], text: index2['slice'](current, index4) });
      (list7['push'](part3), (current = index4 + part3['text']['length']));
    }
    if (current < index2['length']) list7['push']({ ...list3[0x0], text: index2['slice'](current) });
    return list7['filter']((entry) => entry['kind'] === 'voiceover')
      ['map']((response2) => response2['text'])
      ['join']('') === list3[0x0]['text']
      ? [list7]
      : [];
  });
  return list5['length'] === 0x1 ? list5[0x0] : null;
}
export function orderReplicationShotSpeech(list8, list9) {
  const list10 = list8['map']((part4) => ({
    part: part4,
    range: findReplicationAsrSpeechRange(list9, part4['kind'], part4['text']),
  }));
  if (
    list10['length'] &&
    list10['every']((record) => record['range'] && Number['isFinite'](record['range']['startSec']))
  )
    return list10['sort']((payload, handle) => payload['range']['startSec'] - handle['range']['startSec'])[
      'map'
    ]((args2) => ({ ...args2['part'] }));
  const list11 = list9['map'](getReplicationEventSpeech)['filter'](Boolean);
  if (list11['length'] > 0x1) list11['push'](list11['flat']());
  const list12 = list11['filter']((list13) =>
    kinds['every'](
      (state) =>
        list13['filter']((config) => config['kind'] === state)
          ['map']((response3) => response3['text'])
          ['join']('') ===
        list8['filter']((scope) => scope['kind'] === state)
          ['map']((response4) => response4['text'])
          ['join'](''),
    ),
  );
  if (list12['length'] !== 0x1) return null;
  const input = Object['fromEntries'](
      kinds['map']((output) => [
        output,
        list8['filter']((value2) => value2['kind'] === output)['map']((args3) => ({
          ...args3,
        })),
      ]),
    ),
    list14 = [];
  for (const response5 of list12[0x0]) {
    let text = response5['text'];
    while (text) {
      const response6 = input[response5['kind']][0x0];
      if (!response6) return null;
      const value3 = Math['min'](text['length'], response6['text']['length']);
      if (text['slice'](0x0, value3) !== response6['text']['slice'](0x0, value3)) return null;
      (list14['push']({ ...response6, text: text['slice'](0x0, value3) }),
        (text = text['slice'](value3)),
        (response6['text'] = response6['text']['slice'](value3)));
      if (!response6['text']) input[response5['kind']]['shift']();
    }
  }
  return list14;
}
export function findReplicationAsrSpeechRange(list15, value4, list16) {
  const startSec = list15['flatMap']((value5) => getReplicationEventSpeech(value5) || []),
    list17 = [];
  for (let value6 = 0x0; value6 < startSec['length']; value6++) {
    let list18 = '';
    for (let value7 = value6; value7 < startSec['length']; value7++) {
      const endSec = startSec[value7];
      if (
        endSec['kind'] !== value4 ||
        endSec['timingSource'] !== 'asr' ||
        endSec['speakerId'] !== startSec[value6]['speakerId']
      )
        break;
      list18 += endSec['text'];
      if (list16 && list18 === list16) {
        list17['push']({ startSec: startSec[value6]['startSec'], endSec: endSec['endSec'] });
        break;
      }
      if (list18['length'] >= list16['length']) break;
    }
  }
  return list17['length'] === 0x1 ? list17[0x0] : null;
}
