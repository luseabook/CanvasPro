import {
  invalidateStoryVideoReplicationAssetLocalization,
  applyStoryVideoReplicationAnalysis,
  syncStoryVideoReplicationProject,
} from './storyVideoReplication.js';
import {
  REPLICATION_CHARACTER_ROLES,
  REPLICATION_SUBJECT_TYPES,
} from '../../domain/storyGeneration/videoReplicationCharacters.js';
import { REPLICATION_VOICEOVER_KINDS } from '../../domain/storyGeneration/videoReplicationSpeech.js';
function canEdit(enabled) {
  return (
    enabled?.['replication']?.['sourceAnalysis'] &&
    !enabled['clips']?.['length'] &&
    !['queued', 'uploading', 'analyzing']['includes'](enabled['replication']['status'])
  );
}
function commitSourceEdit(value, sourceAnalysis) {
  ((sourceAnalysis['replication']['sourceAnalysis']['revision'] =
    (sourceAnalysis['replication']['sourceAnalysis']['revision'] || 0) + 1),
    applyStoryVideoReplicationAnalysis(sourceAnalysis, {
      sourceAnalysis: sourceAnalysis['replication']['sourceAnalysis'],
    }),
    syncStoryVideoReplicationProject(value),
    invalidateStoryVideoReplicationAssetLocalization(value));
}
export function editStoryReplicationSource(
  item,
  key,
  { kind: kind, id: id, index: index, field: field, value: value2 } = {},
) {
  const enabled2 = key?.['replication']?.['sourceAnalysis'];
  if (!canEdit(key)) return ![];
  const result = enabled2['events']['find']((data) => data['id'] === id);
  let enabled3;
  if (kind === 'story' && field === 'synopsis') enabled3 = enabled2;
  if (
    kind === 'character' &&
    ['name', 'description', 'identityNotes', 'role', 'roleEvidence', 'subjectType']['includes'](field)
  ) {
    if (field === 'role' && !Object['hasOwn'](REPLICATION_CHARACTER_ROLES, value2)) return ![];
    if (field === 'subjectType' && !Object['hasOwn'](REPLICATION_SUBJECT_TYPES, value2)) return ![];
    enabled3 = enabled2['characters']['find']((options) => options['id'] === id);
  }
  if (kind === 'event' && field === 'visual') enabled3 = result;
  if (kind === 'dialogue' && ['speakerId', 'text', 'uncertain']['includes'](field)) {
    enabled3 = result?.['dialogue']?.[Number(index)];
    if (
      field === 'speakerId' &&
      value2 &&
      !enabled2['characters']['some']((target) => target['id'] === value2)
    )
      return ![];
  }
  if (kind === 'voiceover' && ['speakerId', 'text', 'uncertain', 'kind']['includes'](field)) {
    enabled3 = result?.['voiceover']?.[Number(index)];
    if (field === 'kind' && !Object['hasOwn'](REPLICATION_VOICEOVER_KINDS, value2)) return ![];
    if (
      field === 'speakerId' &&
      value2 &&
      !enabled2['characters']['some']((source) => source['id'] === value2)
    )
      return ![];
  }
  if (!enabled3) return ![];
  const enabled4 = field === 'uncertain' ? value2 === !![] : String(value2 ?? '')['trim']();
  if (enabled3[field] === enabled4) return ![];
  if (field === 'name' && !enabled4) return ![];
  enabled3[field] = enabled4;
  if (
    kind === 'voiceover' &&
    ['kind', 'speakerId']['includes'](field) &&
    (enabled3['kind'] === 'uncertain' || (enabled3['kind'] === 'inner_monologue' && !enabled3['speakerId']))
  )
    enabled3['uncertain'] = !![];
  return (commitSourceEdit(item, key), !![]);
}
export function mergeStoryReplicationCharacters(next, current, entry, record) {
  const payload = current?.['replication']?.['sourceAnalysis'];
  if (!canEdit(current) || entry === record) return ![];
  const enabled5 = payload['characters']['find']((handle) => handle['id'] === entry),
    enabled6 = payload['characters']['find']((state) => state['id'] === record);
  if (!enabled5 || !enabled6) return ![];
  for (const args of payload['events']) {
    ((args['characterIds'] = [
      ...new Set(args['characterIds']['map']((config) => (config === entry ? record : config))),
    ]),
      [...args['dialogue'], ...(args['voiceover'] || [])]['forEach']((scope) => {
        if (scope['speakerId'] === entry) scope['speakerId'] = record;
      }));
  }
  ((enabled6['identityNotes'] = [enabled6['identityNotes'], enabled5['identityNotes']]
    ['filter'](Boolean)
    ['join']('\n')),
    (payload['characters'] = payload['characters']['filter']((input) => input !== enabled5)));
  if (next['project']['replication']?.['characterBindings'])
    delete next['project']['replication']['characterBindings'][current['id'] + ':' + entry];
  return (commitSourceEdit(next, current), !![]);
}
export function addStoryReplicationCharacter(
  output,
  value3,
  { timeSec: timeSec, name: name = '新人物' } = {},
) {
  if (!canEdit(value3)) return null;
  const value4 = value3['replication']['sourceAnalysis'],
    enabled7 = value4['events']['find'](
      (value5) => Number(timeSec) >= value5['startSec'] && Number(timeSec) < value5['endSec'],
    );
  if (!enabled7) return null;
  let value6 = 1;
  while (value4['characters']['some']((value7) => value7['id'] === 'person-' + value6)) value6 += 1;
  const value8 = {
    id: 'person-' + value6,
    name: String(name)['trim']() || '新人物',
    description: '',
    role: 'uncertain',
    subjectType: 'person',
    roleEvidence: '',
    identityNotes: '用户补录，请核对外观与出场片段',
    representativeTimeSec: Number(timeSec),
  };
  return (
    value4['characters']['push'](value8),
    enabled7['characterIds']['push'](value8['id']),
    commitSourceEdit(output, value3),
    value8
  );
}
export function removeStoryReplicationCharacter(value9, value10, value11) {
  if (!canEdit(value10)) return ![];
  const enabled8 = value10['replication']['sourceAnalysis'];
  if (!enabled8['characters']['some']((value12) => value12['id'] === value11)) return ![];
  enabled8['characters'] = enabled8['characters']['filter']((value13) => value13['id'] !== value11);
  for (const args2 of enabled8['events']) {
    args2['characterIds'] = args2['characterIds']['filter']((value14) => value14 !== value11);
    for (const value15 of [...args2['dialogue'], ...(args2['voiceover'] || [])])
      value15['speakerId'] === value11 && ((value15['speakerId'] = ''), (value15['uncertain'] = !![]));
  }
  if (value9['project']['replication']?.['characterBindings'])
    delete value9['project']['replication']['characterBindings'][value10['id'] + ':' + value11];
  return (commitSourceEdit(value9, value10), !![]);
}
export function setStoryReplicationCharacterPresence(
  value16,
  value17,
  { characterId: characterId, eventId: eventId, present: present } = {},
) {
  if (!canEdit(value17)) return ![];
  const value18 = value17['replication']['sourceAnalysis'],
    enabled9 = value18['characters']['find']((value19) => value19['id'] === characterId),
    args3 = value18['events']['find']((value20) => value20['id'] === eventId);
  if (!enabled9 || !args3 || args3['characterIds']['includes'](characterId) === present) return ![];
  const list = value18['events']['filter'](
    (value21) => value21 !== args3 && value21['characterIds']['includes'](characterId),
  );
  if (!present && !list['length']) return ![];
  return (
    (args3['characterIds'] = present
      ? [...args3['characterIds'], characterId]
      : args3['characterIds']['filter']((value22) => value22 !== characterId)),
    !present &&
      enabled9['representativeTimeSec'] >= args3['startSec'] &&
      enabled9['representativeTimeSec'] < args3['endSec'] &&
      ((enabled9['representativeTimeSec'] = list[0]['startSec']),
      delete enabled9['frame'],
      delete enabled9['portrait']),
    commitSourceEdit(value16, value17),
    !![]
  );
}
