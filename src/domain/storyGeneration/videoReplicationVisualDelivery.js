import { isStorySeedance25PromptMode } from './promptModes.js';
import { getReplicationVisualGaps } from './videoReplicationTimingContract.js';
import { replicationVisualFields } from './videoReplicationVisualState.js';
export function projectReplicationObservedShots(
  value,
  item,
  { episode: episode, project: project, assets: assets },
) {
  const key = Number(item['sourceStartSec']),
    index = Number(item['sourceEndSec']);
  if (!(index > key) || getReplicationVisualGaps(item['events'], key, index)['length']) return value['shots'];
  const result = new Set(),
    map = item['events']
      ['flatMap']((data) =>
        (data['shots'] || [])['map']((args) => ({ ...args, sound: args['sound'] ?? data['sound'] ?? '' })),
      )
      ['filter']((options) => {
        const target = options['id'] + ':' + options['startSec'] + ':' + options['endSec'];
        if (result['has'](target) || options['endSec'] <= key || options['startSec'] >= index) return false;
        return (result['add'](target), true);
      })
      ['sort']((source, next) => source['startSec'] - next['startSec']);
  if (!map['length'] || map['some']((current) => !String(current['visual'] || '')['trim']()))
    return value['shots'];
  let entry = key;
  for (const record of map) {
    if (Math['abs'](Math['max'](key, record['startSec']) - entry) > 0.001) return value['shots'];
    entry = Math['min'](index, record['endSec']);
  }
  if (Math['abs'](entry - index) > 0.001) return value['shots'];
  const list = episode['replication']['sourceAnalysis']['characters'] || [],
    payload = new Set(list['flatMap']((error) => [error['id'], error['name']])),
    handler = (handle) =>
      (handle || [])
        ['filter'](
          (state) =>
            !list['length'] ||
            payload['has'](state['subject']) ||
            [...String(state['subject'] || '')['matchAll'](/[（(]([^（）()]+)[）)]/gu)]['some']((config) =>
              payload['has'](config[1]),
            ),
        )
        ['map']((scope) =>
          Object['fromEntries'](
            Object['entries'](scope)['map'](([input, output]) => [
              input,
              /^(?:无|未知|不明|N\/A)$/iu['test'](String(output)['trim']()) ? '' : output,
            ]),
          ),
        ),
    enabled = list['flatMap']((error2) => {
      const value2 = project['replication']?.['characterBindings']?.[episode['id'] + ':' + error2['id']],
        value3 = assets['filter'](
          (value4) =>
            value4['kind'] === 'character' &&
            (value2 ? value4['id'] === value2 : value4['replicationSource']?.['ref'] === error2['id']),
        );
      return value3['length'] === 1 && error2['name'] && value3[0]['name'] !== error2['name']
        ? [[error2['name'], value3[0]['name']]]
        : [];
    })['sort']((value5, value6) => value6[0]['length'] - value5[0]['length']),
    handler2 = (value7) => {
      const value8 = String(value7 || '');
      if (!enabled['length']) return value8;
      const value9 = new Map(enabled),
        value10 = enabled['map'](([value11]) => value11['replace'](/[.*+?^${}()|[\]\\]/gu, '\\$&'))['join'](
          '|',
        );
      return value8['replace'](new RegExp(value10, 'gu'), (value12) => value9['get'](value12));
    },
    handler3 = isStorySeedance25PromptMode(value['promptMode'] || project['planning']?.['promptMode'])
      ? Math['round']
      : (value13) => Number(value13['toFixed'](3));
  let value14 = 0;
  const value15 = value['shots']['map']((args2) => ({
      ...args2,
      startSec: value14,
      endSec: (value14 += Number(args2['durationSec'])),
    })),
    list2 = [];
  let args3 = [];
  for (const [value16, value17] of map['entries']()) {
    const value18 = handler3(Math['max'](key, value17['startSec']) - key),
      value19 =
        value16 === map['length'] - 1
          ? Number(item['durationSec'])
          : handler3(Math['min'](index, value17['endSec']) - key);
    if (value19 <= value18) {
      if (list2['length']) list2['at'](-1)['sources']['push'](value17);
      else args3['push'](value17);
      continue;
    }
    (list2['push']({ from: value18, to: value19, sources: [...args3, value17] }), (args3 = []));
  }
  return list2['map'](({ from: from2, to: to, sources: sources }, value20) => {
    const args4 =
        value15['map']((value21) => ({
          shot: value21,
          overlap: Math['min'](to, value21['endSec']) - Math['max'](from2, value21['startSec']),
        }))['sort']((value22, value23) => value23['overlap'] - value22['overlap'])[0]?.['shot'] || {},
      value24 = sources[0],
      value25 = sources['at'](-1),
      list3 = [...(args4['assetUsages'] || [])],
      value26 = sources['map']((value27) => handler2(value27['visual']))['join']('\n');
    for (const value28 of assets['filter'](
      (value29) => value29['kind'] === 'character' && value29['name'] && value26['includes'](value29['name']),
    )) {
      const value30 = value28['ref'] || value28['assetRef'] || value28['id'];
      if (list3['some']((value31) => value31['assetRef'] === value30)) continue;
      const args5 = value15['flatMap']((value32) => value32['assetUsages'] || [])['filter'](
        (value33) => value33['assetRef'] === value30,
      );
      if (
        args5['length'] &&
        new Set(args5['map']((value34) => value34['appearanceRef'] || ''))['size'] === 1
      )
        list3['push']({ ...args5[0] });
    }
    const args6 = replicationVisualFields(value24);
    for (const value35 of ['spatialStart', 'spatialEnd'])
      args6[value35] = handler((value35 === 'spatialStart' ? value24 : value25)[value35])['map']((value36) =>
        Object['fromEntries'](
          Object['entries'](value36)['map'](([value37, value38]) => [value37, handler2(value38)]),
        ),
      );
    return {
      ...args4,
      ...args6,
      assetUsages: list3,
      id: value['ref'] + '-observed-' + (value20 + 1),
      startSec: from2,
      endSec: to,
      durationSec: to - from2,
      visual: sources['map']((value39) => handler2(value39['visual']))
        ['filter'](Boolean)
        ['join']('\n'),
      camera: sources['map']((value40) => handler2(value40['camera']))
        ['filter'](Boolean)
        ['join']('\n'),
      audio: [...new Set(sources['map']((value41) => value41['sound'])['filter'](Boolean))]['join']('\n'),
      dialogue: '',
      voiceover: '',
      replicationSourceShotIds: sources['map']((value42) => value42['id']),
    };
  });
}
