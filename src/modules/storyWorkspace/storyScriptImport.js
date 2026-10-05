const UPLOADED_EPISODE_HEADING_PATTERN =
    /^[ \t]*(?:#{1,6}[ \t]*)?(?:第[ \t]*([0-9０-９零〇一二三四五六七八九十百千两]+)[ \t]*(?:集|话|回)|(?:episode|ep\.?)\s*([0-9０-９]+))[ \t]*(?:[：:.\-—·|][ \t]*)?(.*?)[ \t]*$/gimu,
  UPLOADED_FOUNTAIN_SCENE_HEADING_PATTERN =
    /^(?:\d{1,4}[.)、-]\s*)?(?:INT|EXT|EST|INT\.\/EXT|INT\/EXT|I\/E)(?:\.|\s)\s*\S/iu,
  UPLOADED_NUMBERED_SCENE_HEADING_PATTERN =
    /^(?:第\s*[0-9０-９零〇一二三四五六七八九十百千两]+\s*场|场景\s*[0-9０-９零〇一二三四五六七八九十百千两]+)(?:\s|[：:.、\-—])\s*\S/iu,
  UPLOADED_CHINESE_SCENE_HEADING_PATTERN =
    /^(?:\d{1,4}[.)、-]\s*)?(?:(?:日|夜|晨|早晨|上午|中午|下午|傍晚|黄昏|黎明|凌晨)\s+)?(?:内景|外景|内外景|内外|内|外)(?:\s|[：:.、\-—])\s*\S/iu;
function normalizeText(value) {
  return String(value || '')['trim']();
}
function normalizeFullWidthDigits(item) {
  return String(item || '')['replace'](/[０-９]/g, (key) => String(key['charCodeAt'](0) - 65296));
}
function parseChineseNumber(index) {
  const fullWidthDigits = normalizeFullWidthDigits(index);
  if (/^\d+$/['test'](fullWidthDigits)) return Number(fullWidthDigits);
  const result = {
      零: 0,
      〇: 0,
      一: 1,
      二: 2,
      两: 2,
      三: 3,
      四: 4,
      五: 5,
      六: 6,
      七: 7,
      八: 8,
      九: 9,
    },
    data = { 十: 10, 百: 100, 千: 1000 };
  let options = 0,
    target = 0;
  for (const source of fullWidthDigits) {
    if (Object['prototype']['hasOwnProperty']['call'](result, source)) {
      target = result[source];
      continue;
    }
    const enabled = data[source];
    if (!enabled) return 0;
    ((options += (target || 1) * enabled), (target = 0));
  }
  return options + target;
}
function stripFileExtension(next) {
  const text = normalizeText(next)['replace'](/^.*[\\/]/, '');
  if (!text || text === '粘贴文本') return '';
  return text['replace'](/\.(?:txt|docx?|pdf|md|rtf)$/iu, '')['trim']();
}
function findUploadedEpisodeHeadings(current) {
  const list = [],
    endIndex = new RegExp(
      UPLOADED_EPISODE_HEADING_PATTERN['source'],
      UPLOADED_EPISODE_HEADING_PATTERN['flags'],
    );
  let index2 = endIndex['exec'](current);
  while (index2) {
    (list['push']({
      index: index2['index'],
      endIndex: endIndex['lastIndex'],
      numberToken: index2[1] || index2[2] || '',
      title: normalizeText(index2[3]),
      heading: normalizeText(index2[0]),
    }),
      (index2 = endIndex['exec'](current)));
  }
  return list;
}
function deriveUploadedStoryTitle(entry, record, payload) {
  const stripFileExtension2 = stripFileExtension(entry);
  if (stripFileExtension2) return stripFileExtension2;
  const args =
      String(record || '')
        ['split'](/\r?\n/u)
        ['map'](normalizeText)
        ['find'](Boolean) || '',
    handle = payload[0];
  if (args && args !== handle?.['heading'] && [...args]['length'] <= 80)
    return args['replace'](/^[《〈【】“”"']+|[《〈【】“”"']+$/gu, '')['trim']();
  return handle?.['title'] || '未命名剧本';
}
function isUploadedSceneHeading(state) {
  const args2 = normalizeText(state)['replace'](/^#{1,6}\s*/u, '');
  if (!args2 || [...args2]['length'] > 120) return false;
  return (
    UPLOADED_FOUNTAIN_SCENE_HEADING_PATTERN['test'](args2) ||
    UPLOADED_NUMBERED_SCENE_HEADING_PATTERN['test'](args2) ||
    UPLOADED_CHINESE_SCENE_HEADING_PATTERN['test'](args2)
  );
}
function normalizeUploadedCharacterCue(config) {
  return normalizeText(config)
    ['replace'](/^@/u, '')
    ['replace'](/\s*[（(][^（）()\r\n]{0,40}[）)]\s*$/u, '')
    ['trim']();
}
function extractUploadedSceneCharacters(list2 = []) {
  const list3 = [],
    handler = (scope) => {
      const args3 = normalizeUploadedCharacterCue(scope);
      if (!args3 || [...args3]['length'] > 24) return;
      if (/^(?:旁白|画外音|VO|V\.O\.?|OS|O\.S\.?)$/iu['test'](args3)) return;
      if (!list3['includes'](args3)) list3['push'](args3);
    };
  return (
    list2['forEach']((input, count) => {
      const text2 = normalizeText(input)['replace'](/^[>*#-]+\s*/u, ''),
        output = text2['match'](
          /^(?:【)?([\p{Script=Han}A-Za-z][\p{Script=Han}A-Za-z0-9·•._-]{0,23})(?:】)?(?:\s*[（(][^（）()\r\n]{0,40}[）)])?\s*[:：]/u,
        );
      if (output) {
        handler(output[1]);
        return;
      }
      const value2 = text2['match'](/^@([^\r\n]{1,40})$/u);
      if (value2) {
        handler(value2[1]);
        return;
      }
      const uploadedCharacterCue = normalizeUploadedCharacterCue(text2),
        value3 = count === 0 || !normalizeText(list2[count - 1]),
        value4 = count + 1 < list2['length'] && Boolean(normalizeText(list2[count + 1]));
      if (value3 && value4 && /^[A-Z][A-Z0-9 ._'\-]{0,39}$/u['test'](uploadedCharacterCue))
        handler(uploadedCharacterCue);
    }),
    list3
  );
}
export function parseUploadedStoryEpisodeScenes({
  fullText: fullText = '',
  episodeRef: episodeRef = 'episode-1',
  fallbackHeading: fallbackHeading = '未命名场次',
} = {}) {
  const body = normalizeText(fullText);
  if (!body) return [];
  const list4 = body['split'](/\r?\n/u),
    list5 = [];
  list4['forEach']((value5, value6) => {
    if (isUploadedSceneHeading(value5)) list5['push'](value6);
  });
  if (!list5['length'])
    return [
      {
        ref: episodeRef + '-scene-1',
        heading: normalizeText(fallbackHeading) || '未命名场次',
        characters: extractUploadedSceneCharacters(list4),
        body: body,
        source: 'upload-fallback',
      },
    ];
  return list5['map']((value7, value8) => {
    const value9 = list5[value8 + 1] ?? list4['length'],
      body2 = list4['slice'](value7 + 1, value9);
    return {
      ref: episodeRef + '-scene-' + (value8 + 1),
      heading: normalizeText(list4[value7])['replace'](/^#{1,6}\s*/u, ''),
      characters: extractUploadedSceneCharacters(body2),
      body: body2['join']('\n')['trim'](),
      source: 'upload-structured',
    };
  })['filter']((dom) => dom['heading'] && dom['body']);
}
function createUploadedEpisode({ fullText: fullText2, number: number, title: title, index: index3 }) {
  const episodeRef2 = 'episode-' + (index3 + 1),
    fallbackHeading2 = normalizeText(title) || '第 ' + number + ' 集',
    scenes = parseUploadedStoryEpisodeScenes({
      fullText: fullText2,
      episodeRef: episodeRef2,
      fallbackHeading: fallbackHeading2,
    });
  return {
    id: episodeRef2,
    planningRef: episodeRef2,
    number: number,
    title: fallbackHeading2,
    synopsis: '',
    hook: '',
    sourceChapterIds: [episodeRef2],
    assetRefs: [],
    assetIds: [],
    scriptStatus: 'completed',
    script: {
      schemaVersion: 1,
      source: 'upload',
      episodeRef: episodeRef2,
      scenes: scenes,
      fullText: fullText2,
    },
    clips: [],
    clipCount: 0,
    characterCount: 0,
    sceneCount: 0,
    propCount: 0,
    duration: '--:--',
    status: '待拆分',
  };
}
export function parseUploadedStoryScript({ sourceText: sourceText = '', fileName: fileName = '' } = {}) {
  const fullText3 = normalizeText(sourceText);
  if (!fullText3) throw new Error('没有可导入的剧本文本。');
  const list6 = findUploadedEpisodeHeadings(fullText3),
    list7 = list6['length']
      ? list6['map']((title2, count2) => {
          const value10 = count2 === 0 ? 0 : title2['index'],
            value11 = list6[count2 + 1]?.['index'] ?? fullText3['length'];
          return {
            fullText: fullText3['slice'](value10, value11)['trim'](),
            number: parseChineseNumber(title2['numberToken']) || count2 + 1,
            title: title2['title'],
          };
        })
      : [{ fullText: fullText3, number: 1, title: '' }],
    title3 = deriveUploadedStoryTitle(fileName, fullText3, list6),
    episodes = list7['filter']((value12) => value12['fullText'])['map']((title4, index4) =>
      createUploadedEpisode({
        ...title4,
        index: index4,
        title: title4['title'] || (list7['length'] === 1 ? title3 : ''),
      }),
    );
  if (!episodes['length']) throw new Error('剧本中没有可导入的正文。');
  return {
    title: title3,
    sourceText: fullText3,
    episodes: episodes,
    chapters: episodes['map']((id) => ({
      id: id['id'],
      title: '第 ' + id['number'] + ' 集：' + id['title'],
      content: id['script']['fullText'],
    })),
  };
}
export function attachUploadedStoryAssetsToEpisodes(list8 = [], value13 = []) {
  const list9 = Array['isArray'](value13) ? value13 : [];
  return (Array['isArray'](list8) ? list8 : [])['map']((args4) => {
    const text3 = normalizeText(args4?.['id']),
      assetRefs = list9['filter']((value14) => {
        const list10 = [
          ...(Array['isArray'](value14?.['sourceChapterIds']) ? value14['sourceChapterIds'] : []),
          ...(Array['isArray'](value14?.['appearances'])
            ? value14['appearances']['flatMap']((value15) =>
                Array['isArray'](value15?.['sourceChapterIds']) ? value15['sourceChapterIds'] : [],
              )
            : []),
        ]['map'](normalizeText);
        return list10['includes'](text3);
      }),
      characterCount = (value16) => assetRefs['filter']((value17) => value17?.['kind'] === value16)['length'];
    return {
      ...args4,
      assetRefs: assetRefs['map']((value18) =>
        normalizeText(value18?.['planningRef'] || value18?.['ref'] || value18?.['id']),
      )['filter'](Boolean),
      assetIds: assetRefs['map']((value19) => normalizeText(value19?.['id']))['filter'](Boolean),
      characterCount: characterCount('character'),
      sceneCount: characterCount('scene'),
      propCount: characterCount('prop'),
    };
  });
}
