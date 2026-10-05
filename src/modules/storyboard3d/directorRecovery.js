export function recordDirectorDeletions(value, item, label = '删除内容') {
  if (value['id'] !== item['id'] || !Array['isArray'](value['scenes']) || !Array['isArray'](item['scenes']))
    return item;
  const removed = [];
  for (const key of value['scenes']) {
    const enabled = item['scenes']['find']((index) => index['id'] === key['id']),
      objectIds = key['objects']
        ['filter']((result) => !enabled?.['objects']['some']((data) => data['id'] === result['id']))
        ['map']((options) => options['id']),
      shotIds = key['shots']
        ['filter']((target) => !enabled?.['shots']['some']((source) => source['id'] === target['id']))
        ['map']((next) => next['id']);
    if (!enabled || objectIds['length'] || shotIds['length'])
      removed['push']({
        scene: structuredClone(key),
        wholeScene: !enabled,
        objectIds: objectIds,
        shotIds: shotIds,
      });
  }
  if (removed['length'])
    item['recycleBin'] = [
      ...(item['recycleBin'] || []),
      {
        id: 'recycle-' + globalThis['crypto']['randomUUID'](),
        label: label,
        deletedAt: Date['now'](),
        removed: removed,
      },
    ]['slice'](-20);
  return item;
}
export function normalizeDirectorRecycleBin(current, scene) {
  return (Array['isArray'](current) ? current : [])
    ['slice'](-20)
    ['filter']((entry) => typeof entry?.['id'] === 'string')
    ['map']((id) => ({
      id: id['id'],
      label: String(id['label'] || '删除内容')['slice'](0, 120),
      deletedAt: Math['max'](0, Number(id['deletedAt']) || 0),
      removed: (Array['isArray'](id['removed']) ? id['removed'] : [])
        ['slice'](0, 100)
        ['filter']((record) => record?.['scene'])
        ['map']((wholeScene, payload) => ({
          scene: scene(wholeScene['scene'], payload),
          wholeScene: wholeScene['wholeScene'] === !![],
          objectIds: (Array['isArray'](wholeScene['objectIds']) ? wholeScene['objectIds'] : [])['filter'](
            (handle) => typeof handle === 'string',
          ),
          shotIds: (Array['isArray'](wholeScene['shotIds']) ? wholeScene['shotIds'] : [])['filter'](
            (state) => typeof state === 'string',
          ),
        })),
    }));
}
export function restoreDirectorRecycleEntry(config, scope) {
  const structuredClone2 = structuredClone(config),
    enabled2 = structuredClone2['recycleBin']?.['find']((input) => input['id'] === scope);
  if (!enabled2) throw new Error('回收记录不存在。');
  for (const output of enabled2['removed']) {
    let enabled3 = structuredClone2['scenes']['find']((value2) => value2['id'] === output['scene']['id']);
    if (!enabled3) {
      structuredClone2['scenes']['push'](structuredClone(output['scene']));
      continue;
    }
    const map = new Set();
    for (const value3 of output['scene']['objects'])
      output['objectIds']['includes'](value3['id']) &&
        !enabled3['objects']['some']((value4) => value4['id'] === value3['id']) &&
        (enabled3['objects']['push'](structuredClone(value3)), map['add'](value3['id']));
    for (const value5 of enabled3['objects'])
      if (value5['parentId'] && !enabled3['objects']['some']((value6) => value6['id'] === value5['parentId']))
        delete value5['parentId'];
    for (const value7 of output['scene']['shots']) {
      const enabled4 = enabled3['shots']['find']((value8) => value8['id'] === value7['id']);
      if (!enabled4 && output['shotIds']['includes'](value7['id'])) {
        enabled3['shots']['push'](structuredClone(value7));
        continue;
      }
      if (!enabled4) continue;
      (enabled4['animation']['objectTracks']['push'](
        ...structuredClone(
          value7['animation']['objectTracks']['filter'](
            (value9) =>
              map['has'](value9['objectId']) &&
              !enabled4['animation']['objectTracks']['some'](
                (value10) => value10['objectId'] === value9['objectId'],
              ),
          ),
        ),
      ),
        enabled4['animation']['actionClips']['push'](
          ...structuredClone(
            value7['animation']['actionClips']['filter'](
              (value11) =>
                map['has'](value11['objectId']) &&
                !enabled4['animation']['actionClips']['some']((value12) => value12['id'] === value11['id']),
            ),
          ),
        ));
      const map2 = new Set(
        enabled4['animation']['objectTracks']
          ['filter']((value13) => map['has'](value13['objectId']))
          ['flatMap']((value14) =>
            ['position', 'rotation', 'scale']['flatMap']((value15) =>
              value14[value15 + 'Keyframes']['map']((value16) => value16['id']),
            ),
          ),
      );
      ((enabled4['animation']['motionClips'] ||= []),
        enabled4['animation']['motionClips']['push'](
          ...structuredClone(
            (value7['animation']['motionClips'] || [])['filter'](
              (value17) =>
                value17['keyframeIds']['some']((value18) => map2['has'](value18)) &&
                !enabled4['animation']['motionClips']['some']((value19) => value19['id'] === value17['id']),
            ),
          ),
        ));
      for (const value20 of map)
        if (value7['animation']['objectPaths']?.[value20])
          (enabled4['animation']['objectPaths'] ||= {})[value20] = structuredClone(
            value7['animation']['objectPaths'][value20],
          );
      for (const value21 of ['followObjectId', 'lookAtObjectId'])
        if (
          !enabled4['animation']['cameraConstraint'][value21] &&
          map['has'](value7['animation']['cameraConstraint'][value21])
        )
          enabled4['animation']['cameraConstraint'][value21] =
            value7['animation']['cameraConstraint'][value21];
      ((enabled4['animation']['cameraConstraintClips'] ||= []),
        enabled4['animation']['cameraConstraintClips']['push'](
          ...structuredClone(
            (value7['animation']['cameraConstraintClips'] || [])['filter'](
              (value22) =>
                (map['has'](value22['followObjectId']) || map['has'](value22['lookAtObjectId'])) &&
                !enabled4['animation']['cameraConstraintClips']['some'](
                  (value23) => value23['id'] === value22['id'],
                ),
            ),
          ),
        ));
    }
  }
  return (
    (structuredClone2['recycleBin'] = structuredClone2['recycleBin']['filter'](
      (value24) => value24['id'] !== scope,
    )),
    structuredClone2
  );
}
export function directorDeletionImpact(value25, list) {
  const map3 = new Set(list),
    value26 = value25['shots']['filter']((value27) => map3['has'](value27['cameraId']))['length'],
    value28 = value25['shots']['reduce'](
      (value29, value30) =>
        value29 +
        value30['animation']['objectTracks']['filter']((value31) => map3['has'](value31['objectId']))[
          'length'
        ],
      0,
    ),
    value32 = value25['shots']['reduce'](
      (value33, value34) =>
        value33 +
        [value34['animation']['cameraConstraint'], ...(value34['animation']['cameraConstraintClips'] || [])][
          'filter'
        ]((value35) => map3['has'](value35['followObjectId']) || map3['has'](value35['lookAtObjectId']))[
          'length'
        ],
      0,
    );
  return (
    '已移入回收站：' +
    list['length'] +
    ' 个对象，关联 ' +
    value26 +
    ' 个镜头、' +
    value28 +
    ' 条运动轨道、' +
    value32 +
    ' 项跟拍约束。可在导演编排中恢复。'
  );
}
