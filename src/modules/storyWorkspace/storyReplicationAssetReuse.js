import { mergeStoryPlanningAssets } from './storyPlanningData.js';
import { getStoryReplicationSubjects } from './storyReplicationReplacement.js';
import { reconcileStoryReplicationAssetIdentity } from './storyReplicationAssetIdentity.js';
export function mergeStoryReplicationAssets(value, list = [], item = {}) {
  const key = item['preserveMedia'] !== false,
    storyReplicationSubjects = getStoryReplicationSubjects(value),
    list2 = key ? reconcileStoryReplicationAssetIdentity(value, storyReplicationSubjects) : [],
    list3 = list2['filter']((index) => index['kind'] === 'character'),
    result = value['project']['replication']?.['characterBindings'] || {},
    map = new Map();
  for (const { key: key2, episodeId: episodeId, character: character } of storyReplicationSubjects) {
    const args =
        list3['find']((data) => data['id'] === result[key2]) ||
        list3['find']((options) => options['replicationSource']?.['subjectKeys']?.['includes'](key2)),
      target = args ? 'asset:' + args['id'] : 'source:' + key2;
    if (map['has'](target)) {
      const args2 = map['get'](target);
      (args2['replicationSource']['subjectKeys']['push'](key2),
        (args2['sourceChapterIds'] = [...new Set([...args2['sourceChapterIds'], episodeId])]));
      continue;
    }
    const ref = 'source:' + key2,
      replicationSource = {
        name: character['name'],
        description: character['description'],
        ref: character['id'],
        subjectKeys: [key2],
      },
      args3 = args
        ? { ...args, replicationSource: { ...args['replicationSource'], subjectKeys: [key2] } }
        : {
            kind: 'character',
            ref: ref,
            name: character['name'],
            description: character['description'],
            role:
              { main: '主角', supporting: '配角', background: '路人', uncertain: '待确认' }[
                character['role']
              ] || '待确认',
            sourceChapterIds: [episodeId],
            occurrences: episodeId,
            prompt: character['visualPrompt'] || '',
            replicationSource: replicationSource,
          };
    ((args3['replicationSource'] = { ...replicationSource, ...args3['replicationSource'] }),
      (args3['sourceChapterIds'] = [...new Set([...(args3['sourceChapterIds'] || []), episodeId])]));
    const [source] = mergeStoryPlanningAssets(args ? [args] : [], [args3], item);
    (args &&
      ((source['appearances'] = args['appearances'] || source['appearances']),
      (source['prompt'] = args['prompt'] || source['prompt'])),
      map['set'](target, source));
  }
  const list4 = [...map['values']()],
    map2 = new Set(list4['map']((next) => next['id']));
  return [
    ...list4,
    ...list3['filter']((current) => !map2['has'](current['id'])),
    ...mergeStoryPlanningAssets(
      list2['filter']((entry) => entry['kind'] !== 'character'),
      list['filter']((record) => record['kind'] !== 'character'),
      item,
    ),
  ];
}
