function removeUnpairedStrongMarkersFromLine(list = '') {
  const list2 = [];
  let enabled = ![];
  for (let value = 0; value < list['length']; value += 1) {
    if (list[value] === '`' && list[value - 1] !== '\\') {
      enabled = !enabled;
      continue;
    }
    if (
      enabled ||
      list[value] !== '*' ||
      list[value + 1] !== '*' ||
      list[value - 1] === '*' ||
      list[value + 2] === '*' ||
      list[value - 1] === '\\'
    )
      continue;
    (list2['push'](value), (value += 1));
  }
  const list3 = [],
    args = new Set();
  return (
    list2['forEach']((item) => {
      const key = list[item - 1] || '',
        index = list[item + 2] || '',
        result = Boolean(index && !/\s/u['test'](index)),
        data = Boolean(key && !/\s/u['test'](key));
      if (data && list3['length'] > 0) list3['pop']();
      else result ? list3['push'](item) : args['add'](item);
    }),
    list3['forEach']((options) => args['add'](options)),
    [...args]
      ['sort']((target, source) => source - target)
      ['reduce']((list4, next) => {
        let list5 = list4['slice'](0, next),
          list6 = list4['slice'](next + 2);
        if (/[ \t]$/['test'](list5) && /^[ \t]/['test'](list6)) list6 = list6['slice'](1);
        else {
          if (!list5 && /^[ \t]/['test'](list6)) list6 = list6['slice'](1);
          else !list6 && /[ \t]$/['test'](list5) && (list5 = list5['slice'](0, -1));
        }
        return '' + list5 + list6;
      }, list)
  );
}
function removeUnpairedStrongMarkers(current = '') {
  return String(current || '')
    ['split']('\n')
    ['map']((entry) => removeUnpairedStrongMarkersFromLine(entry))
    ['join']('\n');
}
function restoreMalformedBlockBoundaries(record = '') {
  return String(record || '')
    ['replace'](/(^|\n)[ \t]*((?:-{3,}|\*{3,}|_{3,}))[ \t]+(?=\S)/g, '$1$2\n\n')
    ['replace'](/([。！？；.!?;])[ \t]+((?:-{3,}|\*{3,}|_{3,}))[ \t]+(?=\S)/g, '$1\n\n$2\n\n')
    ['replace'](
      /^(#{1,3}\s+.{1,160}?)[ \t]+(?=(?:\*\*[^*\n]{2,48}\*\*(?:[：:]|[ \t]|$)|(?:核心概念|文案|Slogan)[：:]))/gim,
      '$1\n\n',
    );
}
export function formatAgentAssistantMarkdown(payload = '') {
  const list7 = String(payload || '')
    ['replace'](/\r\n?/g, '\n')
    ['trim']();
  if (!list7 || list7['includes']('```')) return list7;
  const handle = list7['replace'](/(^|\n)[ \t]*((?:-{3,}|\*{3,}|_{3,}))[ \t]+(?=\S)/g, '$1$2\n\n')
    ['replace'](/([。！？；])\s+(\*\*[^*\n]{2,48}\*\*[：:])/g, '$1\n\n$2')
    ['replace'](/([：:])\s*(\*\*[^*\n]{2,48}\*\*[：:])/g, '$1\n\n$2')
    ['replace'](/([。！？；])\s*(?=[^\n。！？；]{2,32}[：:])/g, '$1\n\n')
    ['replace'](
      /([。！？；])\s+(?=(?:创作目标|素材分组|当前进展|项目概览|后续建议|下一步[^：:\n]{0,24})[：:])/g,
      '$1\n\n',
    )
    ['replace'](/([：:])\s+(?=\d+[.)]\s+)/g, '$1\n')
    ['replace'](/([。！？；])\s+(?=\d+[.)]\s+)/g, '$1\n')
    ['replace'](/([^\n])\s+(\d+[.)]\s+)/g, '$1\n$2');
  return removeUnpairedStrongMarkers(restoreMalformedBlockBoundaries(handle))['replace'](
    /\n{3,}/g,
    '\n\n',
  );
}
