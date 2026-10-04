const text = (value) => String(value ?? '')['trim'](),
  mediaCount = (item) =>
    (item['appearances'] || [])['filter']((key) => key['imageUrl'])['length'] +
    Number(Boolean(item['imageUrl']));
export function reconcileStoryReplicationAssetIdentity(index, list) {
  const list2 = index['assets'] || [],
    map = new Set(list['map']((event) => event['key'])),
    map2 = new Set(),
    map3 = new Map(),
    result = (index['project']['replication']['characterBindings'] ||= {});
  for (const event2 of list) {
    const text2 = text(event2['character']['name']);
    if (
      !text2 ||
      list['filter'](
        (data) => data['episodeId'] === event2['episodeId'] && text(data['character']['name']) === text2,
      )['length'] !== 0x1
    )
      continue;
    const list3 = list2['filter'](
      (options) =>
        options['kind'] === 'character' &&
        !map2['has'](options['id']) &&
        text(options['replicationSource']?.['name']) === text2 &&
        options['sourceChapterIds']?.['includes'](event2['episodeId']) &&
        !(options['replicationSource']?.['subjectKeys'] || [])['some'](
          (target) => map['has'](target) && target !== event2['key'],
        ),
    );
    if (!list3['length']) continue;
    const source = list2['find']((next) => next['id'] === result[event2['key']]);
    if (source && !list3['includes'](source)) continue;
    const args = [...list3]['sort'](
        (current, entry) =>
          mediaCount(entry) - mediaCount(current) || Number(entry === source) - Number(current === source),
      )[0x0],
      map4 = new Map((args['appearances'] || [])['map']((record) => [record['id'], record])),
      args2 = new Set([...(args['replicationSource']['subjectKeys'] || []), event2['key']]);
    for (const payload of list3) {
      if (payload === args) continue;
      for (const handle of payload['appearances'] || [])
        if (!map4['has'](handle['id'])) map4['set'](handle['id'], handle);
      for (const state of payload['replicationSource']['subjectKeys'] || []) args2['add'](state);
      for (const config of ['id', 'planningRef', 'ref']) {
        if (payload[config] && args[config]) map3['set'](payload[config], args[config]);
      }
      map2['add'](payload['id']);
    }
    ((args['appearances'] = [...map4['values']()]),
      (args['replicationSource'] = { ...args['replicationSource'], subjectKeys: [...args2] }),
      (result[event2['key']] = args['id']));
  }
  const run = (list4) => {
    if (typeof list4 === 'string') {
      if (map3['has'](list4)) return map3['get'](list4);
      for (const [scope, input] of map3)
        list4 = list4['split']('story-asset:' + encodeURIComponent(scope) + ':')['join'](
          'story-asset:' + encodeURIComponent(input) + ':',
        );
      return list4;
    }
    if (Array['isArray'](list4)) return list4['map'](run);
    if (list4 && typeof list4 === 'object') {
      for (const output of Object['keys'](list4)) list4[output] = run(list4[output]);
    }
    return list4;
  };
  return (
    map2['size'] && (run(index['episodes']), run(result)),
    list2['filter']((value2) => !map2['has'](value2['id']))
  );
}
