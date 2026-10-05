import { protectStoryPromptPills } from './storyClipPromptReferences.js';
import { normalizeStoryPromptMode } from './storyPromptModes.js';
const text = (value) => String(value ?? '')['trim'](),
  escapeRegExp = (item) => item['replace'](/[.*+?^${}()|[\]\\]/gu, '\\$&'),
  ref = (key) => text(key?.['planningRef'] || key?.['ref'] || key?.['id']),
  matchesRef = (index, result) => [text(index?.['id']), ref(index)]['includes'](text(result)),
  mention = (data, options) =>
    '@' + text(data['name']) + (text(options?.['name']) ? ' · ' + text(options['name']) : '');
function compactCharacterReferenceHeaders(target, source) {
  const args = new Map(),
    next = 'character-reference-header';
  for (const { asset: asset, appearance: appearance, token: token } of source) {
    if (asset['kind'] !== 'character') continue;
    const regExp = new RegExp(
      '(^|\\n|<div>|<p>|<br\\s*/?>)' + escapeRegExp(token) + '：人物外观、发型和服装以该参考图为准。',
      'gu',
    );
    target = target['replace'](regExp, (current, entry) => {
      const record = args['size'] === 0;
      return (args['set'](asset['id'] + ':' + appearance['id'], token), entry + (record ? next : ''));
    });
  }
  return target['replace'](
    next,
    '人物形象、发型与服装分别参考 ' + [...args['values']()]['join']('、') + '。',
  );
}
function compactSeedanceReplicationLines(payload, handle, state) {
  const run = (config) => {
      for (const scope of handle)
        config = config['split'](scope['token'])['join'](mention(scope['asset'], scope['appearance']));
      return config['trim']();
    },
    input = payload['split']('\n'),
    count = input['findIndex']((output) => output['startsWith']('人物站位：')),
    value2 = input['findIndex']((value3) => /^分镜1\b/u['test'](value3));
  if (count >= 0 && value2 > count) {
    const value4 = input[count]['slice']('人物站位：'['length']);
    (!run(input[value2])['includes'](run(value4)) &&
      (input[value2] = input[value2]['replace']('：', '：' + value4 + ' ')),
      (input[count] = ''));
  }
  let value5 = -1;
  return input['map']((value6) => {
    const value7 = value6['match'](/^分镜(\d+)\b/u)?.[1];
    if (value7) value5 = Number(value7) - 1;
    if (
      state['shots']?.[value5]?.['dialogue'] &&
      /^音效：(?:人声对话|激动的人声对话)[。.]?$/u['test'](value6)
    )
      return '';
    return value6['replace'](
      /^发声与口型约束：本分镜仅(.+?)发声并同步口型；(.+?)其他画面角色保持静默，不张嘴、不做说话口型。$/u,
      (value8, value9, value10) =>
        '发声与口型约束：' + value9 + '说话时口型同步；' + value10['replace'](/及$/u, '') + '保持沉默。',
    )
      ['replace'](
        /^发声与口型约束：本分镜仅(.+?)发声并同步口型；其他画面角色保持静默，不张嘴、不做说话口型。$/u,
        '发声与口型约束：$1说话时口型同步，其他角色保持沉默。',
      )
      ['replace'](
        /^发声与口型约束：本分镜对白按标注顺序轮流发声；每句仅当前标注的说话人发声并同步口型；其余角色保持静默，不张嘴、不做说话口型。$/u,
        '发声与口型约束：按台词顺序轮流说话，当前说话人口型同步，其他角色保持沉默。',
      );
  })
    ['filter'](Boolean)
    ['join']('\n');
}
export function getStoryReplicationCharacterDisplayLabel(enabled, value11, value12 = []) {
  if (enabled?.['kind'] !== 'character' || !enabled['replicationSource']) return '';
  const value13 = value12['filter']((value14) => value14['kind'] === 'character'),
    count2 = value13['findIndex']((value15) => value15['id'] === enabled['id']);
  if (count2 < 0) return '';
  const list = enabled['appearances'] || [],
    value16 = list['findIndex']((value17) => value17['id'] === value11?.['id']);
  return (
    '角色' +
    (count2 + 1) +
    ' · ' +
    (value11?.['sourceOrigin'] === 'library' ? '替换形象' : '参考形象') +
    (list['length'] > 1 ? value16 + 1 : '')
  );
}
function selectedCharacters(value18, value19) {
  const map = new Map();
  for (const value20 of value18) {
    for (const value21 of value20['assetUsages'] || []) {
      const value22 = value19['filter']((value23) => matchesRef(value23, value21['assetRef'])),
        value24 = value22['length'] === 1 ? value22[0] : null;
      if (value24?.['kind'] !== 'character') continue;
      const value25 = value24['appearances'] || [],
        enabled2 = value21['appearanceRef']
          ? value25['find']((value26) => matchesRef(value26, value21['appearanceRef']))
          : value25['find']((value27) => value27['id'] === value24['baseAppearanceId']) || value25[0];
      if (!enabled2) continue;
      const enabled3 = map['get'](value24['id']);
      if (!enabled3) map['set'](value24['id'], { asset: value24, appearance: enabled2 });
      else {
        if (enabled3['appearance']?.['id'] !== enabled2['id'])
          map['set'](value24['id'], { asset: value24, appearance: null });
      }
    }
  }
  return [...map['values']()]['filter']((value28) => value28['appearance']);
}
export function syncStoryReplicationPromptReferences(value29, value30 = {}, value31 = []) {
  if (
    value30['promptMode'] === 'seedance-2.5' &&
    String(value29)['includes']('【参考素材】') &&
    String(value29)['includes']('【分镜与声音】')
  )
    return value29;
  if (
    value30['promptMode'] === 'seedance-2.5' &&
    String(value29)['includes']('素材定义（本片段）：') &&
    String(value29)['includes']('素材定义结束。')
  )
    return value29;
  const storyPromptMode =
      normalizeStoryPromptMode(value30['promptMode'], { allowDeveloperModes: true }) === 'seedance-2.0',
    protectStoryPromptPills2 = protectStoryPromptPills(value29);
  let args2 = protectStoryPromptPills2['source'];
  const value32 = [],
    handler = (value33) => {
      const value34 = 'replication-text-' + value32['length'] + '';
      return (value32['push']({ token: value34, content: value33 }), value34);
    },
    list2 = [];
  for (const value35 of value31) {
    for (const value36 of value35['appearances'] || []) {
      const mention2 = mention(value35, value36);
      list2['push']({ asset: value35, appearance: value36, label: mention2 });
    }
  }
  const list3 = [],
    map2 = new Map(
      [...args2['matchAll'](/((?:<|&lt;)Subject \d+(?:>|&gt;)) 是角色 ([^，\n]+)，/gu)]['map']((value37) => [
        value37[2],
        value37[1],
      ]),
    );
  args2 = args2['replace'](/((?:<|&lt;)Subject \d+(?:>|&gt;)) 是角色 [^，\n]+，/gu, '$1 是人物参考，');
  const args3 = new Map(list2['map']((value38) => [value38['label'], value38])),
    list4 = [...args3['keys']()]['sort']((list5, value39) => value39['length'] - list5['length']);
  if (list4['length'])
    args2 = args2['replace'](new RegExp(list4['map'](escapeRegExp)['join']('|'), 'gu'), (value40) => {
      const value41 = handler(value40);
      return (list3['push']({ ...args3['get'](value40), token: value41 }), value41);
    });
  for (const value42 of protectStoryPromptPills2['pills']) {
    const args4 = list2['find'](({ asset: asset2, appearance: appearance2 }) =>
      value42['html']['includes'](
        'data-asset-id="story-asset:' +
          encodeURIComponent(asset2['id']) +
          ':' +
          encodeURIComponent(appearance2['id']) +
          '"',
      ),
    );
    if (args4) list3['push']({ ...args4, token: value42['token'] });
  }
  for (const { asset: asset3, token: token2 } of list3) {
    if (asset3['kind'] !== 'character') continue;
    const escapeRegExp2 = escapeRegExp(token2),
      value43 = '(^|\\n|<div>|<p>|<br\\s*/?>)';
    ((args2 = args2['replace'](
      new RegExp(
        value43 +
          '将(?:<|&lt;)' +
          escapeRegExp2 +
          '(?:>|&gt;)[^\\n]*?定义为(?:<|&lt;)[^\\n]*?(?:>|&gt;)。(?:人物外观、发型和服装以该参考图为准。)?',
        'gu',
      ),
      (value44, value45) => '' + value45 + token2 + '：人物外观、发型和服装以该参考图为准。',
    )),
      (args2 = args2['replace'](
        new RegExp('' + value43 + escapeRegExp2 + '：定义为[^。\\n]*。', 'gu'),
        (value46, value47) => '' + value47 + token2 + '：人物外观、发型和服装以该参考图为准。',
      )));
  }
  if (storyPromptMode) args2 = compactCharacterReferenceHeaders(args2, list3);
  ((args2 = args2['replace'](
    /(^|\n|<div>|<p>|<br\s*\/?>)画外音：([^\n]*?)(?=<\/(?:div|p)>|<br\s*\/?>|\n|$)/gu,
    (value48, list6, value49) => {
      const enabled4 = value49['match'](/^([^：:]+)[：:]([\s\S]*)$/u);
      if (!enabled4) return list6 + handler(value48['slice'](list6['length']));
      const value50 = enabled4[1]['trim'](),
        value51 = value50['match'](/^(旁白|内心独白|独白|解说|画外音)[（(]([^）)]+)[）)]$/u),
        value52 = value51 ? value51[2]['trim']() : value50,
        value53 = value31['filter'](
          (value54) =>
            value54['kind'] === 'character' &&
            [text(value54['name']), text(value54['replicationSource']?.['name'])]['includes'](value52),
        );
      if (value53['length'] !== 1) return list6 + handler(value48['slice'](list6['length']));
      const value55 = value53[0],
        edCharacters = selectedCharacters(value30['shots'] || [], value31)['find'](
          (value56) => value56['asset']['id'] === value55['id'],
        ),
        value57 = value55['appearances'] || [],
        enabled5 = edCharacters?.['appearance'] || (value57['length'] === 1 ? value57[0] : null);
      if (!enabled5) return list6 + handler(value48['slice'](list6['length']));
      const value58 = list3['find'](
          (value59) =>
            value59['asset']['id'] === value55['id'] && value59['appearance']['id'] === enabled5['id'],
        ),
        value60 =
          map2['get'](text(value55['name'])) || value58?.['token'] || handler(mention(value55, enabled5));
      return (
        list6 +
        '画外音：' +
        (value51?.[1] || '旁白') +
        '（' +
        value60 +
        '，该旁白不驱动口型）：' +
        handler(enabled4[2])
      );
    },
  )),
    (args2 = args2['replace'](/(?:<d>|&lt;d&gt;)[\s\S]*?(?:<\/d>|&lt;\/d&gt;)/gu, handler)
      ['replace'](/<[^>]+>/gu, handler)
      ['replace'](/“[^”]*”|「[^」]*」|"[^"\n]*"|&quot;[\s\S]*?&quot;/gu, handler)),
    (args2 = args2['replace'](
      /(^|\n)(声音设定（[^\n]*?）：)([^\n]*)/gu,
      (value61, value62, value63, value64) => value62 + value63 + handler(value64),
    )),
    (args2 = args2['replace'](
      /(^|\n)((?:本片段场景设定在|本片段道具设定)：[^\n]*)/gu,
      (value65, value66, value67) => value66 + handler(value67),
    )));
  const value68 = value31['filter']((value69) => value69['kind'] !== 'character')
    ['map']((value70) => text(value70['name']))
    ['filter'](Boolean)
    ['sort']((value71, list7) => list7['length'] - value71['length']);
  if (value68['length'])
    args2 = args2['replace'](new RegExp(value68['map'](escapeRegExp)['join']('|'), 'gu'), handler);
  const value72 = value30['shots'] || [];
  if (storyPromptMode) args2 = compactSeedanceReplicationLines(args2, list3, value30);
  const edCharacters2 = selectedCharacters(value72, value31);
  let args5 = edCharacters2;
  args2 = args2['split']('\n')
    ['map']((value73) => {
      const value74 = value73['replace'](/\uE002replication-text-(\d+)\uE003/gu, (value75, value76) =>
          value32[value76]?.['content']['startsWith']('<') ? '' : value75,
        ),
        value77 = value74['match'](/^(?:分镜|镜头|\[Shot )(\d+)/u)?.[1];
      if (value77) args5 = selectedCharacters([value72[Number(value77) - 1] || {}], value31);
      else {
        const value78 = value74['match'](/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)秒：/u)?.[1];
        if (value78 != null)
          args5 = selectedCharacters(
            value72['filter'](
              (value79) => Number(Number(value79['startSec'])['toFixed'](1)) === Number(value78),
            ),
            value31,
          );
      }
      const map3 = new Map();
      for (const value80 of args5) {
        const text2 = text(value80['asset']['name']);
        map3['set'](text2, map3['has'](text2) ? null : value80);
      }
      const value81 = [...args5, ...list3]['filter'](
        ({ asset: asset4, appearance: appearance3 }) =>
          asset4['kind'] === 'character' &&
          appearance3?.['sourceOrigin'] === 'library' &&
          appearance3['imageUrl'],
      );
      for (const { asset: asset5, appearance: appearance4, token: token3 } of value81) {
        const text3 = text(appearance4['name']),
          enabled6 = token3 || text(asset5['name']);
        if (!text3 || !enabled6) continue;
        value73 = value73['replace'](
          new RegExp(
            '(' + escapeRegExp(enabled6) + ')[ \\t]*[（(]' + escapeRegExp(text3) + '[）)](?![ \\t]*[：:])',
            'gu',
          ),
          '$1',
        );
      }
      const enabled7 = [...map3['keys']()]
        ['filter'](Boolean)
        ['sort']((value82, value83) => value83['length'] - value82['length']);
      if (!enabled7['length']) return value73;
      return value73['replace'](
        new RegExp(enabled7['map'](escapeRegExp)['join']('|'), 'gu'),
        (value84, value85) => {
          if (value73[value85 - 1] === '@') return value84;
          const enabled8 = map3['get'](value84);
          if (!enabled8) return value84;
          if (map2['has'](value84)) return map2['get'](value84);
          const value86 = list3['find'](
            (value87) =>
              value87['token']['startsWith']('') &&
              value87['asset']['id'] === enabled8['asset']['id'] &&
              value87['appearance']['id'] === enabled8['appearance']['id'],
          );
          return value86?.['token'] || mention(enabled8['asset'], enabled8['appearance']);
        },
      );
    })
    ['join']('\n');
  for (const { token: token4, content: content } of value32['reverse']())
    args2 = args2['split'](token4)['join'](content);
  return protectStoryPromptPills2['restore'](args2);
}
