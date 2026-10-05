import { buildReplicationFlowPrompt } from '../../domain/storyGeneration/videoReplicationFlowPrompt.js';
import { defineReplicationPromptMaterials } from './storyReplicationDefinitions.js';
import { orderReplicationShotSpeech } from '../../domain/storyGeneration/videoReplicationSpeechOrder.js';
import {
  resolveReplicationSpeechTiming,
  findReplicationAsrSpeechRange,
} from '../../domain/storyGeneration/videoReplicationSpeechTiming.js';
const text = (value) => String(value || '')['trim']();
function speechParts(item, key, list, index = []) {
  return text(item)
    ['split'](/\n/u)
    ['filter'](Boolean)
    ['map']((result) => {
      const data = result['match'](/^([^：:\r\n]+)[：:]([\s\S]*)$/u),
        options = data?.[1]['trim']() || '',
        enabled = options['match'](/^(?:旁白|内心独白|独白|解说|画外音)[（(](.+)[）)]$/u),
        target = list['some'](
          (source) =>
            source['kind'] === 'character' &&
            [source['name'], source['replicationSource']?.['name']]['includes'](options),
        ),
        enabled2 = enabled?.[1] || (target ? options : options['replace'](/[（(].*$/u, '')),
        text2 = text(data ? data[2] : result)['replace'](/^“([\s\S]*)”$/u, '$1'),
        next = index['flatMap']((current) => current[key] || [])['filter'](
          (enabled3) => enabled3['text'] === text2 && !enabled3['uncertain'],
        ),
        list2 = [...new Set(next['map']((entry) => entry['speakerId'])['filter'](Boolean))],
        record = !enabled2 || /^(旁白|画外音|解说|解说／旁白|独白|内心独白)$/u['test'](enabled2),
        payload = list['filter'](
          (handle) =>
            handle['kind'] === 'character' &&
            ([handle['name'], handle['replicationSource']?.['name']]['includes'](enabled2) ||
              (record && list2['length'] === 1 && handle['replicationSource']?.['ref'] === list2[0])),
        ),
        state = payload['length'] === 1 ? payload[0] : null,
        config = state ? state['name'] : record ? '' : enabled2,
        scope =
          !enabled && data
            ? options['slice'](enabled2['length'])['replace'](/^\(/u, '（')['replace'](/\)$/u, '）')
            : '',
        input = config && !/^(旁白|画外音|解说|独白|内心独白)$/u['test'](config) ? '' + config + scope : '';
      return {
        kind: key,
        speakerId: state?.['id'] || '',
        speakerLabel: input,
        text: /^“[\s\S]*”$/u['test'](text2) ? text2['slice'](1, -1) : text2,
      };
    });
}
export function buildStoryReplicationTimelinePrompt({
  clip: clip,
  shots: shots,
  assets: assets,
  referenceHeader: referenceHeader,
  continuityLines: continuityLines,
  visualStyle: visualStyle,
}) {
  let output = 0;
  const value2 = shots['map']((args, value3) => {
      const value4 = output;
      return (
        (output += args['durationSec']),
        {
          ...args,
          id: 'shot-' + (value3 + 1),
          startSec: value4,
          endSec: output,
          sound: text(args['audio'])
            ['replace'](/画外音时间[：:]\s*\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?秒?[，。；;]?/gu, '')
            ['replace'](/(?:画外音|旁白|人声)(?:延续|继续|结束)(?:至\d+(?:\.\d+)?秒)?[。；;]?/gu, '')
            ['replace'](/对白同步发生[。；;]?/gu, '')
            ['replace'](/^(?:(?:环境音|音效)[：:]\s*)+/u, ''),
        }
      );
    }),
    list3 = value2['flatMap']((value5) =>
      ['voiceover', 'dialogue']['flatMap']((value6) => {
        const speechParts2 = speechParts(value5[value6], value6, assets, clip['replicationSpeechEvents']);
        if (!speechParts2['length']) return [];
        const value7 = speechParts2['map']((value8) => {
          const replicationAsrSpeechRange = findReplicationAsrSpeechRange(
            clip['replicationSpeechEvents'] || [],
            value6,
            value8['text'],
          );
          return replicationAsrSpeechRange ? { part: value8, line: replicationAsrSpeechRange } : null;
        });
        if (value7['every'](Boolean))
          return value7['map'](({ part: part, line: line }, value9) => ({
            id: value5['id'] + '-' + value6 + '-' + value9,
            asrTimed: true,
            startSec: Math['max'](0, line['startSec'] - (clip['sourceStartSec'] || 0)),
            endSec: Math['min'](output, line['endSec'] - (clip['sourceStartSec'] || 0)),
            parts: [part],
          }));
        const { startSec: startSec, endSec: endSec } = resolveReplicationSpeechTiming({
          clip: clip,
          shot: value5,
          kind: value6,
          parts: speechParts2,
          durationSec: output,
        });
        return [{ id: value5['id'] + '-' + value6, startSec: startSec, endSec: endSec, parts: speechParts2 }];
      }),
    );
  for (const value10 of value2) {
    const list4 = list3['filter']((value11) => value11['id']['startsWith'](value10['id'] + '-'));
    if (list4['every']((value12) => value12['asrTimed'])) continue;
    if (list4['length'] < 2) continue;
    const value13 = (clip['replicationSpeechEvents'] || [])['filter'](
        (value14) =>
          value14['endSec'] > value10['startSec'] + (clip['sourceStartSec'] || 0) &&
          value14['startSec'] < value10['endSec'] + (clip['sourceStartSec'] || 0),
      ),
      orderReplicationShotSpeech2 = orderReplicationShotSpeech(
        list4['flatMap']((value15) => value15['parts']),
        value13,
      );
    if (!orderReplicationShotSpeech2) continue;
    for (const value16 of list4) list3['splice'](list3['indexOf'](value16), 1);
    list3['push']({
      id: value10['id'] + '-ordered',
      startSec: value10['startSec'],
      endSec: value10['endSec'],
      parts: orderReplicationShotSpeech2,
    });
  }
  list3['sort']((value17, value18) => value17['startSec'] - value18['startSec']);
  const args2 = new Map();
  for (const args3 of list3) {
    const value19 = args3['startSec'] + ':' + args3['endSec'];
    if (args2['has'](value19)) args2['get'](value19)['parts']['push'](...args3['parts']);
    else args2['set'](value19, { ...args3, parts: [...args3['parts']] });
  }
  const value20 = (clip['replicationCharacters'] || [])['map']((error) => {
      const value21 = assets['filter'](
        (value22) =>
          value22['kind'] === 'character' &&
          (value22['replicationSource']?.['ref'] === error['id'] ||
            value22['replicationSource']?.['name'] === error['name']),
      );
      return { ...error, name: value21['length'] === 1 ? value21[0]['name'] : error['name'] };
    }),
    replicationFlowPrompt = buildReplicationFlowPrompt(
      { characters: value20, speech: [...args2['values']()], contentType: clip['replicationContentType'] },
      {
        start: 0,
        end: output,
        shots: value2,
        used: [],
        promptMode: clip['promptMode'],
        referenceHeader: '',
        continuityLines: continuityLines,
        integerTime: true,
        shotSpeech: true,
        stagingHandoff: clip['replicationStagingHandoff'] === true,
      },
    );
  return defineReplicationPromptMaterials(replicationFlowPrompt['prompt'], shots, assets, visualStyle);
}
