import { markStoryReplicationPromptsStale } from './storyReplicationPromptFreshness.js';
const text = (value) => String(value ?? '')['trim']();
export function getStoryReplicationSubjects(item) {
  return (item['episodes'] || [])['flatMap']((episodeId) =>
    (episodeId['replication']?.['sourceAnalysis']?.['characters'] || [])['map']((character) => ({
      episodeId: episodeId['id'],
      character: character,
      key: episodeId['id'] + ':' + character['id'],
      episodeTitle: episodeId['title'],
    })),
  );
}
export function captureStoryReplicationAssetSources(key) {
  if (key['project']?.['sourceMode'] !== 'video-replication') return;
  const storyReplicationSubjects = getStoryReplicationSubjects(key),
    index = (key['project']['replication']['characterBindings'] ||= {});
  for (const name of key['assets'] || []) {
    if (!name['replicationSource'])
      name['replicationSource'] = {
        name: name['name'],
        description: name['description'],
        ref: name['ref'],
      };
  }
  for (const event of storyReplicationSubjects) {
    if (
      key['assets']['some'](
        (result) => result['kind'] === 'character' && result['id'] === index[event['key']],
      )
    )
      continue;
    const list = key['assets']['filter'](
      (data) =>
        data['kind'] === 'character' &&
        data['replicationSource']?.['subjectKeys']?.['includes'](event['key']),
    );
    if (list['length'] === 1) {
      index[event['key']] = list[0]['id'];
      continue;
    }
    const list2 = key['assets']['filter'](
      (enabled) =>
        enabled['kind'] === 'character' &&
        !enabled['replicationSource']?.['subjectKeys']?.['length'] &&
        (text(enabled['replicationSource']?.['name']) === event['character']['name'] ||
          text(enabled['replicationSource']?.['ref']) === event['character']['id']) &&
        (!enabled['sourceChapterIds']?.['length'] ||
          enabled['sourceChapterIds']['includes'](event['episodeId'])),
    );
    if (list2['length'] === 1) index[event['key']] = list2[0]['id'];
  }
}
export function getStoryReplicationBindingError(enabled2) {
  if (enabled2['project']?.['sourceMode'] !== 'video-replication') return '';
  const options = enabled2['project']['replication']?.['characterBindings'] || {},
    list3 = getStoryReplicationSubjects(enabled2)['filter'](
      (event2) =>
        !enabled2['assets']['some'](
          (target) => target['kind'] === 'character' && target['id'] === options[event2['key']],
        ),
    );
  return list3['length']
    ? '请先为 ' + list3['length'] + ' 个原片角色选择对应的新角色；保留原形象时也请选择对应素材。'
    : '';
}
export function updateStoryReplicationReplacement(enabled3, { field: field, key: key2, value: value2 } = {}) {
  if (enabled3['project']?.['sourceMode'] !== 'video-replication') return false;
  const source = enabled3['project']['replication'];
  if (field === 'characterBinding') {
    if (
      !getStoryReplicationSubjects(enabled3)['some']((event3) => event3['key'] === key2) ||
      (value2 && !enabled3['assets']['some']((next) => next['id'] === value2 && next['kind'] === 'character'))
    )
      return false;
    if (source['characterBindings']?.[key2] === text(value2)) return false;
    (((source['characterBindings'] ||= {})[key2] = text(value2)),
      markStoryReplicationPromptsStale(
        enabled3,
        getStoryReplicationSubjects(enabled3)['find']((event4) => event4['key'] === key2)['episodeId'],
      ));
  } else {
    if (field === 'targetLocale' && ['source', 'zh-CN', 'ja-JP', 'ko-KR', 'en-US']['includes'](value2)) {
      const list4 = (enabled3['episodes'] || [])['filter'](
          (enabled4) => !enabled4['replication']?.['targetLocale'],
        ),
        enabled5 = list4['some']((current) =>
          (current['clips'] || [])['some'](
            (entry) => entry['promptLanguage'] && entry['promptLanguage'] !== value2,
          ),
        );
      if (source['targetLocale'] === value2 && !enabled5) return false;
      source['targetLocale'] = value2;
      for (const record of list4) {
        markStoryReplicationPromptsStale(enabled3, record['id']);
        for (const payload of record['clips'] || []) {
          if (payload['promptLanguage'] === value2) delete payload['requiredDialogueLanguage'];
          else payload['requiredDialogueLanguage'] = value2;
        }
      }
    } else return false;
  }
  return true;
}
