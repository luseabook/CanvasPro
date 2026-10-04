const text = (value) => String(value || '')['trim'](),
  matches = (item, key) => Boolean(key) && [item['id'], item['ref'], item['planningRef']]['includes'](key);
export function completeReplicationScenePropUsages(list, list2) {
  const list3 = list2['filter']((index) => ['scene', 'prop']['includes'](index['kind']));
  return list['map']((args) => {
    const list4 = (args['visual'] || '') + '\x20' + (args['camera'] || ''),
      assetUsages = [...(args['assetUsages'] || [])];
    for (const assetRef of list3) {
      if (assetUsages['some']((result) => matches(assetRef, result['assetRef']))) continue;
      const list5 = text(assetRef['name']),
        list6 = [list5, text(assetRef['replicationSource']?.['name'])];
      for (let count = list5['length'] - 0x1; count >= 0x2; count--) {
        const data = list5['slice'](-count);
        if (list3['filter']((error) => text(error['name'])['endsWith'](data))['length'] === 0x1)
          list6['push'](data);
      }
      const appearanceRef = assetRef['appearances'] || [];
      if (
        appearanceRef['length'] !== 0x1 ||
        !list6['some']((list7) => list7['length'] >= 0x2 && list4['includes'](list7))
      )
        continue;
      assetUsages['push']({
        assetRef: assetRef['planningRef'] || assetRef['ref'] || assetRef['id'],
        appearanceRef:
          appearanceRef[0x0]['planningRef'] || appearanceRef[0x0]['ref'] || appearanceRef[0x0]['id'],
      });
    }
    return { ...args, assetUsages: assetUsages };
  });
}
export function defineReplicationPromptMaterials(list8, list9, options, target = '') {
  const list10 = [];
  for (const error2 of options)
    for (const error3 of error2['appearances'] || []) {
      const mention = '@' + error2['name'] + ' · ' + error3['name'],
        enabled = list9['some']((source) =>
          (source['assetUsages'] || [])['some'](
            (next) => matches(error2, next['assetRef']) && matches(error3, next['appearanceRef']),
          ),
        );
      if (!enabled && !list8['includes'](mention)) continue;
      const alias =
          error2['kind'] === 'character'
            ? error2['name']
            : (error2['appearances'] || [])['length'] > 0x1
              ? error2['name'] + '（' + error3['name'] + '）'
              : error2['name'],
        current =
          error2['kind'] === 'character' ? '角色' : error2['kind'] === 'scene' ? '参考场景' : '参考道具',
        text2 = text(error3['description'] || error2['description'])['replace'](/[。]+$/u, ''),
        line =
          error2['kind'] === 'character'
            ? '将\x20' + mention + ' 中的角色定义为' + alias + '。'
            : '将\x20' + mention + ' 定义为' + alias + '的' + current + '。',
        list11 = list9['flatMap']((entry, record) =>
          (entry['assetUsages'] || [])['some'](
            (payload) => matches(error2, payload['assetRef']) && matches(error3, payload['appearanceRef']),
          )
            ? [record + 0x1]
            : [],
        ),
        handle =
          error2['kind'] === 'character' && error2['appearances']['length'] > 0x1 && list11['length']
            ? '用于第' + list11['join']('、') + '个镜头。'
            : '';
      list10['push']({
        mention: mention,
        alias: alias,
        line: line + handle + (error2['kind'] !== 'character' && text2 ? '外观与状态：' + text2 + '。' : ''),
      });
    }
  const list12 = [...list10]['sort'](
      (state, config) => config['mention']['length'] - state['mention']['length'],
    ),
    scope = list8['split']('\x0a')
      ['map']((input) =>
        input['startsWith']('画面文字：')
          ? input
          : input['split'](/(“[^”]*”)/u)
              ['map']((output, value2) =>
                value2 % 0x2
                  ? output
                  : list12['reduce'](
                      (value3, value4) => value3['split'](value4['mention'])['join'](value4['alias']),
                      output,
                    ),
              )
              ['join'](''),
      )
      ['join']('\x0a'),
    value5 =
      '按下方分镜描述呈现画面、镜头和声音；人物参考图确定外观，人物位置与持物按具体站位和动作呈现。片段结束站位是已有动作的结果，不额外定格或延长时间；不添加未描述的画面文字或背景音乐。';
  return [
    '【统一风格与约束】',
    ...(text(target) ? [text(target)] : []),
    value5,
    '',
    '【参考素材】',
    ...list10['map']((value6) => value6['line']),
    '',
    '【分镜与声音】',
    scope,
  ]['join']('\x0a');
}
