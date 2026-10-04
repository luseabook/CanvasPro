const text = (value) => String(value ?? '')['trim'](),
  escapeRegExp = (item) => item['replace'](/[.*+?^${}()|[\]\\]/gu, '\\$&'),
  escapeHtml = (key) =>
    key['replace'](/&/gu, '&amp;')
      ['replace'](/</gu, '&lt;')
      ['replace'](/>/gu, '&gt;')
      ['replace'](/"/gu, '&quot;');
export function protectStoryPromptPills(index = '') {
  const pills = [],
    html = String(index),
    result = /<span\b[^>]*\bclass\s*=\s*["'][^"']*\bref-pill\b[^"']*["'][^>]*>/giu;
  let source = '',
    data = 0x0,
    options;
  while ((options = result['exec'](html))) {
    const target = /<\/?span\b[^>]*>/giu;
    target['lastIndex'] = result['lastIndex'];
    let next = 0x1,
      current = result['lastIndex'],
      entry;
    while (next && (entry = target['exec'](html))) {
      ((next += /^<\//u['test'](entry[0x0]) ? -0x1 : 0x1), (current = target['lastIndex']));
    }
    if (next) break;
    const token = 'story-pill-' + pills['length'] + '';
    (pills['push']({ token: token, html: html['slice'](options['index'], current) }),
      (source += html['slice'](data, options['index']) + token),
      (data = current),
      (result['lastIndex'] = current));
  }
  return {
    source: source + html['slice'](data),
    pills: pills,
    restore: (record) =>
      pills['reduce']((payload, handle) => payload['split'](handle['token'])['join'](handle['html']), record),
  };
}
export function syncStoryClipPromptReferences(state, list = []) {
  if (String(state)['includes']('【参考素材】') && String(state)['includes']('【分镜与声音】')) return state;
  const ctx = protectStoryPromptPills(state || '');
  let list2 = ctx['source'];
  const config = ctx['pills']['length'] > 0x0;
  list['some']((scope) => scope['replicationSource']) &&
    (list2 = list2['split']('\x0a')
      ['filter']((input) => text(input) !== '保留原视频的视觉风格、场景和道具')
      ['join']('\x0a'));
  for (const error of list) {
    for (const error2 of error['appearances'] || []) {
      const list3 =
          '@' + text(error['name']) + (text(error2['name']) ? '\x20·\x20' + text(error2['name']) : ''),
        regExp = new RegExp(
          '<span\\b(?=[^>]*\\bdata-label="' +
            escapeRegExp(escapeHtml(list3['slice'](0x1))) +
            '")[^>]*>[\\s\\S]*?<\\/span>',
          'gu',
        ),
        args = ctx['pills']
          ['filter']((output) => {
            return (
              (regExp['lastIndex'] = 0x0),
              output['html']['includes'](
                'data-asset-id=\x22story-asset:' +
                  encodeURIComponent(error['id']) +
                  ':' +
                  encodeURIComponent(error2['id']) +
                  '\x22',
              ) || regExp['test'](output['html'])
            );
          })
          ['map']((value2) => value2['token']),
        list4 = [list3, ...args];
      if (error['kind'] === 'character' && error2['sourceOrigin'] === 'library' && error2['imageUrl']) {
        for (const value3 of new Set(list4)) {
          const value4 = value3 !== list3,
            value5 = value4 ? '&lt;' : '<',
            value6 = value4 ? '&gt;' : '>',
            value7 = value4 ? escapeHtml(text(error['name'])) : text(error['name']),
            regExp2 = new RegExp(
              '(^|\x5cn|<div>|<p>|<br\x5cs*/?>)将' +
                value5 +
                escapeRegExp(value3) +
                value6 +
                '[^\x5cn]*?定义为' +
                value5 +
                escapeRegExp(value7) +
                value6 +
                '。(?=$|\\n|</div>|</p>|<br\\s*/?>)',
              'gu',
            );
          list2 = list2['replace'](
            regExp2,
            (value8, value9) =>
              value9 +
              '将' +
              value5 +
              value3 +
              value6 +
              '定义为' +
              value5 +
              value7 +
              value6 +
              '。人物外观、发型和服装以该参考图为准。',
          );
        }
        if (list4['some']((value10) => list2['includes'](value10)))
          list2 = list2['split']('\x0a')
            ['filter']((enabled) => !enabled['startsWith']('声音设定（' + error['name'] + '）：'))
            ['join']('\x0a');
      }
      if (
        error['replicationSource'] &&
        ['scene', 'prop']['includes'](error['kind']) &&
        !text(error2['imageUrl'])
      ) {
        const text2 = text(error2['description'] || error['description']),
          value11 = '' + text(error['name']) + (text2 ? '（' + text2 + '）' : '');
        list2 = list2['replace'](
          new RegExp(escapeRegExp(list3) + '(?=$|[。；;，,：:\x5cs<>])', 'gu'),
          () => value11,
        );
        if (config) {
          for (const value12 of args) list2 = list2['split'](value12)['join'](escapeHtml(value11));
        }
      }
    }
  }
  return ctx['restore'](list2['trim']());
}
