import { getReplicationEventSpeech } from './videoReplicationSpeechOrder.js';
import { isStorySeedance25PromptMode } from './promptModes.js';
import {
  findReplicationSpeechBlock,
  groupContinuousReplicationVoiceover,
} from './videoReplicationSpeechLayout.js';
import { separateReplicationGeneratedFields } from './videoReplicationFieldLayout.js';
import { projectReplicationObservedShots } from './videoReplicationVisualDelivery.js';
export function usesOriginalAsrSpeech(enabled, value = {}) {
  if (!enabled['replication']?.['sourceAnalysis']?.['speechEvidence']) return false;
  const item = enabled['replication']['targetLocale'] || value['replication']?.['targetLocale'] || 'source',
    key = enabled['replication']['sourceAnalysis']['sourceLanguage'];
  return (
    item === 'source' ||
    item === key ||
    (item === 'zh-CN' && /^(zh(?:-CN|-Hans)?|Chinese|中文|普通话|汉语)$/iu['test'](key))
  );
}
export function applyReplicationAsrDelivery(clips, episode, project = {}, assets = []) {
  if (!usesOriginalAsrSpeech(episode, project) || !Array['isArray'](clips?.['clips'])) return clips;
  const list = episode['replication']['sourceAnalysis']['characters'] || [];
  return {
    ...clips,
    clips: clips['clips']['map']((args) => {
      const enabled2 = episode['replication']['segmentPlan']?.['find'](
        (index) => index['ref'] === args['ref'],
      );
      if (!enabled2 || !args['shots']?.['length']) return args;
      const list2 = enabled2['events']
        ['flatMap']((result) => getReplicationEventSpeech(result) || [])
        ['sort']((data, options) => data['startSec'] - options['startSec']);
      if (list2['some']((target) => target['timingSource'] !== 'asr')) return args;
      let endSec = 0;
      const list3 = projectReplicationObservedShots(args, enabled2, {
          episode: episode,
          project: project,
          assets: assets,
        }),
        shots = list3['map']((source) => {
          const startSec = endSec;
          return (
            (endSec += Number(source['durationSec'])),
            {
              ...separateReplicationGeneratedFields(
                source,
                list2['map']((response) => response['text'])['join'](''),
              ),
              startSec: startSec,
              endSec: endSec,
              dialogue: '',
              voiceover: '',
            }
          );
        }),
        isStorySeedance25PromptMode2 = isStorySeedance25PromptMode(
          args['promptMode'] || project['planning']?.['promptMode'],
        ),
        next = isStorySeedance25PromptMode2 ? Math['round'] : (current) => current,
        list4 = list2['map']((endSec2) => {
          const startSec2 = Math['max'](0, endSec2['startSec'] - enabled2['sourceStartSec']),
            error = list['find']((entry) => entry['id'] === endSec2['speakerId']),
            enabled3 =
              project['replication']?.['characterBindings']?.[episode['id'] + ':' + endSec2['speakerId']],
            error2 = assets['find'](
              (record) =>
                record['kind'] === 'character' &&
                (record['id'] === enabled3 ||
                  (!enabled3 && record['replicationSource']?.['ref'] === endSec2['speakerId'])),
            ),
            payload = error2?.['name'] || error?.['name'] || '',
            speakerLabel =
              endSec2['kind'] === 'dialogue'
                ? payload || '说话人待核对'
                : payload
                  ? '旁白（' + payload + '）'
                  : '旁白';
          return {
            startSec: startSec2,
            endSec: endSec2['endSec'] - enabled2['sourceStartSec'],
            shotIndex: findReplicationSpeechBlock(
              shots,
              startSec2,
              next,
              0,
              endSec2['endSec'] - enabled2['sourceStartSec'],
            ),
            parts: [
              {
                kind: endSec2['kind'],
                speakerId: endSec2['speakerId'],
                speakerLabel: speakerLabel,
                text: endSec2['text'],
              },
            ],
          };
        });
      for (const [handle, state] of shots['entries']()) {
        const config = list4['filter']((scope) => scope['shotIndex'] === handle),
          input = isStorySeedance25PromptMode2
            ? groupContinuousReplicationVoiceover(config, list4, next, (output) =>
                output['speakerId'] ? output['speakerLabel'] : '',
              )
            : config;
        for (const { parts: parts } of input)
          for (const response2 of parts) {
            state[response2['kind']] = [
              state[response2['kind']],
              response2['speakerLabel'] + '：' + response2['text'],
            ]
              ['filter'](Boolean)
              ['join']('\n');
          }
      }
      return { ...args, durationSec: endSec, shots: shots };
    }),
  };
}
