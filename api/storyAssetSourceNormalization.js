// Source character/scene normalization helpers extracted from storyAssetExperimentalApi.js.

export function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}
export function normalizeStringArray(item) {
  return [...new Set((Array.isArray(item) ? item : []).map(normalizeText).filter(Boolean))];
}
export function normalizeReference(key, index = '') {
  return normalizeText(key).replace(/\s+/g, '-') || index;
}
export function getResultText(response) {
  if (typeof response === 'string') return response;
  return response?.text || response?.outputText || response?.content || response || '';
}
export async function requestStrictAgentResult({
  request: request2,
  requestPayload: requestPayload,
  parse: parse,
  outputContract: outputContract,
  maxAttempts: maxAttempts = 2,
}) {
  let result = await request2(requestPayload);
  for (let data = 1; data <= maxAttempts; data += 1) {
    try {
      return parse(result);
    } catch (error) {
      if (data >= maxAttempts) throw error;
      result = await request2({
        ...requestPayload,
        temperature: 0.1,
        prompt: JSON.stringify({
          task: 'repair_invalid_agent_response',
          originalRequest: JSON.parse(requestPayload.prompt),
          rejectionReason: normalizeText(error?.message || error),
          rejectedResponse: normalizeText(getResultText(result)),
          instruction: '重新执行原任务，只返回符合要求的严格 JSON 对象。',
          outputContract: outputContract,
        }),
      });
    }
  }
  throw new Error('Agent 返回结果校验失败。');
}
export function normalizeStoryContext(options = {}) {
  const chapterIds2 = Array.isArray(options?.chapters)
      ? options.chapters.map((target, source) => ({
          id: normalizeText(target?.id) || 'chapter-' + (source + 1),
          title: normalizeText(target?.title),
        }))
      : [],
    enabled = {
      title: normalizeText(options?.title),
      storyType: normalizeText(options?.storyType),
      summary: normalizeText(options?.summary || options?.storySummary),
      background: normalizeText(options?.background || options?.storyBackground),
      setting: normalizeText(options?.setting || options?.storySetting),
      logline: normalizeText(options?.logline),
      continuityFacts: normalizeStringArray([
        ...(Array.isArray(options?.continuityFacts) ? options.continuityFacts : []),
        ...(Array.isArray(options?.storyFacts) ? options.storyFacts : []),
      ]).slice(0, 20),
      characters: (Array.isArray(options?.characters) ? options.characters : [])
        .map((error2) => ({
          ref: normalizeText(error2?.ref),
          name: normalizeText(error2?.name),
          roleType: normalizeText(error2?.roleType || error2?.role),
          fixedTraits: normalizeText(error2?.fixedTraits),
          profile: normalizeText(error2?.profile),
        }))
        .filter((error3) => error3.name)
        .slice(0, 12),
      scriptMode: normalizeText(options?.scriptMode) || 'plot',
      aspectRatio: normalizeText(options?.aspectRatio) || '16:9',
      visualStyle: normalizeText(
        options?.videoStylePrompt || options?.visualStyle || options?.videoStyle,
      ),
      chapterIds: chapterIds2.map((next) => next.id),
    };
  if (!enabled.title || !enabled.chapterIds.length) throw new Error('请先完成并确认全部分集剧本。');
  return enabled;
}
export function normalizeSourceCharacters(current) {
  return normalizeStringArray(current).filter((entry) => !/^(?:旁白|画外音|VO|OS)$/iu.test(entry));
}
const STORY_SOURCE_NON_CHARACTER_LABELS = new Set([
    '旁白',
    '画外音',
    'vo',
    'v.o',
    'v.o.',
    'os',
    'o.s',
    'o.s.',
    '时间',
    '时长',
    '地点',
    '目的地',
    '状态',
    '场景',
    '内景',
    '外景',
    '镜头',
    '画面',
    '动作',
    '音效',
    '音乐',
    '字幕',
    '备注',
    '出场人物',
    '登场人物',
    '出场角色',
    '人物',
    '角色',
    '台词',
    '环境',
    '转场',
  ]),
  STORY_SOURCE_DIALOGUE_ACTION_SUFFIX_PATTERN =
    /(?:快速)?(?:检索|搜索|查找|查看|翻阅|操作|记录|回应|回答|追问|补充|继续|解释)$/u,
  STORY_SOURCE_NONVISUAL_SPEAKER_PATTERN =
    /^(?:系统广播|机械广播|电子广播|电子合成音|录音笔|电话|手机|广播|扩音器|扬声器|喇叭|电视|收音机|新闻主播|电视主播|电台主播)$/u,
  STORY_SOURCE_ANONYMOUS_GROUP_PATTERN =
    /^(?:[零一二两三四五六七八九十百\d]+|数|多|几)(?:名|位|个)(?:[\p{Script=Han}]{1,8})$/u;
export function normalizeSourceCharacterName(record) {
  const args = normalizeText(record)
    .replace(/^[【\[]|[】\]]$/gu, '')
    .replace(/[（(][^（）()\r\n]{0,30}[）)]\s*$/u, '')
    .replace(/^(?:演员|饰演)\s*[:：]\s*/u, '')
    .trim();
  if (!args || [...args].length > 12) return '';
  if (STORY_SOURCE_NON_CHARACTER_LABELS.has(args.toLowerCase())) return '';
  if (STORY_SOURCE_NONVISUAL_SPEAKER_PATTERN.test(args)) return '';
  if (/(?:旁白|画外音|字幕|音效|音乐)$/u.test(args)) return '';
  if (/^(?:第?\d+[场幕镜]|场次|章节|日|夜|白天|黑夜)$/u.test(args)) return '';
  if (/^(?:然后|随后|接着|紧接着|这时|此时)(?:他|她|它)?/u.test(args)) return '';
  if (/^(?:若干|数名|多名)|(?:若干|数人|多人|等人)$/u.test(args)) return '';
  if (STORY_SOURCE_ANONYMOUS_GROUP_PATTERN.test(args)) return '';
  if (!/^[\p{Script=Han}A-Za-z0-9·•._-]+$/u.test(args)) return '';
  return args;
}
export function normalizeDeterministicStoryCharacterCandidate(payload) {
  const args2 = normalizeSourceCharacterName(payload).replace(
      /(?:及|与)(?:其)?(?:弟子|随从|众人|同伴)$/u,
      '',
    ),
    count = [...args2].length;
  if (!args2 || count < 2 || count > 8) return '';
  if (/^无(?:相应)?实体$/u.test(args2)) return '';
  if (/^第[一二三四五六七八九十百千万\d]+(?:道|次|个|名|位|集|章|场|幕|镜)$/u.test(args2)) return '';
  if (/^(?:他|她|它|他们|她们|它们|众人|人群|观众|子殿下)$/u.test(args2)) return '';
  if (/(?:若干|数人|多人|[一二三四五六七八九十\d]+人)$/u.test(args2)) return '';
  if (STORY_SOURCE_ANONYMOUS_GROUP_PATTERN.test(args2)) return '';
  if (/^(?:只想|该是|才能|如果|因为|为了|已经|这个|那个)/u.test(args2)) return '';
  if (/(?:说话|曲子|意赅|怎样的奇女子)$/u.test(args2)) return '';
  return args2;
}
export function getDeterministicStoryCharacterCandidates(options2 = {}) {
  return normalizeStringArray(
    normalizeStringArray(options2?.characters).map(normalizeDeterministicStoryCharacterCandidate),
  );
}
export function getStoryAssetNameAliases(handle) {
  const args3 = normalizeText(handle);
  if (!args3) return [];
  const args4 = [...args3.matchAll(/[（(]([^（）()\r\n]+)[）)]/gu)].map((state) =>
      normalizeText(state[1]),
    ),
    text = normalizeText(args3.replace(/[（(][^（）()\r\n]+[）)]/gu, ''));
  return normalizeStringArray(
    [args3, text, ...args4].flatMap((config) => [config, normalizeSourceCharacterName(config)]),
  );
}
export function storyCharacterNamesOverlap(scope, input) {
  const map = new Set(getStoryAssetNameAliases(input).map((output) => output.toLowerCase()));
  return getStoryAssetNameAliases(scope).some((value2) => map.has(value2.toLowerCase()));
}
export function storyCharacterNamesStronglyOverlap(value3, value4) {
  if (storyCharacterNamesOverlap(value3, value4)) return true;
  const list = normalizeDeterministicStoryCharacterCandidate(value3).toLowerCase(),
    list2 = normalizeDeterministicStoryCharacterCandidate(value4).toLowerCase();
  if (!list || !list2) return false;
  if (/[a-z0-9]/u.test(list) || /[a-z0-9]/u.test(list2)) return false;
  const [args5, list3] = list.length <= list2.length ? [list, list2] : [list2, list];
  return (
    [...args5].length >= 2 &&
    [...list3].length - [...args5].length <= 3 &&
    list3.includes(args5)
  );
}
export function addDeterministicStoryCharacterCandidate(map2, value5, value6) {
  const value7 = [...map2.entries()].find(
    ([value8, value9]) =>
      storyCharacterNamesStronglyOverlap(value8, value5) ||
      (value9?.aliases || []).some((value10) => storyCharacterNamesStronglyOverlap(value10, value5)),
  );
  if (value7) {
    const [value11, args6] = value7;
    (args6.sourceSceneRefs.push(value6),
      (args6.aliases = normalizeStringArray([...args6.aliases, value5])),
      map2.set(value11, args6));
    return;
  }
  map2.set(value5, { aliases: [value5], sourceSceneRefs: [value6] });
}
export function createDeterministicStoryCharacterCandidateMap(list4 = []) {
  const value12 = new Map();
  return (
    list4.forEach((value13) => {
      getDeterministicStoryCharacterCandidates(value13).forEach((value14) => {
        addDeterministicStoryCharacterCandidate(value12, value14, value13.ref);
      });
    }),
    value12
  );
}
export function resolveDeterministicStoryCharacterCanonicalName(value15, map3) {
  const deterministicStoryCharacterCandidate = normalizeDeterministicStoryCharacterCandidate(value15);
  if (!deterministicStoryCharacterCandidate) return '';
  const value16 = [...map3.entries()].find(
    ([value17, value18]) =>
      storyCharacterNamesStronglyOverlap(value17, deterministicStoryCharacterCandidate) ||
      (value18?.aliases || []).some((value19) =>
        storyCharacterNamesStronglyOverlap(value19, deterministicStoryCharacterCandidate),
      ),
  );
  return value16?.[0] || deterministicStoryCharacterCandidate;
}
const STORY_CHARACTER_TRAILING_ACTION_PATTERN =
  /^(?:(?:正|又|还|便|只|连忙|忙)?(?:附耳|噘着嘴|不死心|安抚|劝说|劝道|说道|问道|答道|喊道|笑道|哭道|皱眉|点头|摇头|转身|抬手|挥手|走向|看向|望着|盯着|站起|坐下|推开|握住|拿起|放下|冷笑|苦笑|大喊).*)$/u;
export function getStoryAssetLocalCharacterCanonicalNames(list5 = []) {
  return normalizeStringArray(
    list5.flatMap((value20) => [
      ...normalizeStringArray(value20?.localEntityCandidates?.character),
      ...(Array.isArray(value20?.localEntityEvidence)
        ? value20.localEntityEvidence
            .filter((value21) => value21?.kind === 'character')
            .map((response2) => response2?.text)
        : []),
    ])
      .map(normalizeDeterministicStoryCharacterCandidate)
      .filter(Boolean),
  );
}
export function resolveStoryAssetCharacterCanonicalName(value22, value23, list6 = []) {
  const list7 = normalizeDeterministicStoryCharacterCandidate(value22);
  if (!list7) return '';
  const value24 = list6.filter(
    (list8) =>
      list8 !== list7 &&
      list7.startsWith(list8) &&
      STORY_CHARACTER_TRAILING_ACTION_PATTERN.test(list7.slice(list8.length)),
  ).sort((args7, args8) => [...args8].length - [...args7].length)[0];
  return value24 || resolveDeterministicStoryCharacterCanonicalName(list7, value23);
}
export function resolveStoryProjectCharacterCanonicalName(value25, list9 = []) {
  return list9.find((value26) => storyCharacterNamesOverlap(value26, value25)) || '';
}
export function extractStorySourceCastNames(value27 = '') {
  const list10 = [],
    text2 = normalizeText(value27),
    value28 = /(?:出场人物|登场人物|出场角色)\s*[:：]\s*([^\r\n]+)/gu;
  let value29 = value28.exec(text2);
  while (value29) {
    const value30 = value29[1]
      .replace(/[（(][^（）()\r\n]{0,30}[）)]/gu, '')
      .split(/\s{2,}|[；;。]/u)[0];
    (value30.split(/[、,，/／|]/u).forEach((value31) => {
      const sourceCharacterName = normalizeSourceCharacterName(value31);
      if (sourceCharacterName) list10.push(sourceCharacterName);
    }),
      (value29 = value28.exec(text2)));
  }
  return normalizeStringArray(list10);
}
export function isLikelyStorySourceDialogueSpeaker(args9, list11 = []) {
  if (!args9) return false;
  if (list11.includes(args9)) return true;
  if (list11.some((value32) => args9.startsWith(value32))) return false;
  if ([...args9].length > 6) return false;
  if (/^(?:他|她|它|他们|她们|它们|众人|人群|观众|评论区|弹幕)/u.test(args9)) return false;
  if (/^(?:然后|随后|接着|紧接着|这时|此时)(?:他|她|它)?/u.test(args9)) return false;
  if (/(?:若干|数人|多人|等人)$/u.test(args9)) return false;
  return !/(?:面无表情|面不改色|一把|抓住|咳着|喊出声|已经|炸了|冷笑|苦笑|说道|问道|答道|开口|皱眉|点头|摇头|转身|抬手|挥手|走向|看向|望着|盯着|站起|坐下|推开|握住|拿起|放下)$/u.test(args9);
}
export function normalizeStorySourceDialogueSpeaker(value33) {
  const sourceCharacterName2 = normalizeSourceCharacterName(value33)
    .replace(STORY_SOURCE_DIALOGUE_ACTION_SUFFIX_PATTERN, '')
    .trim();
  if (!sourceCharacterName2 || STORY_SOURCE_NONVISUAL_SPEAKER_PATTERN.test(sourceCharacterName2))
    return '';
  return sourceCharacterName2;
}
export function isDeclaredStorySourceSpeakerAlias(value34, list12 = []) {
  const args10 = normalizeText(value34);
  if (!args10) return false;
  return list12.some(
    (value35) =>
      storyCharacterNamesOverlap(value35, args10) ||
      ([...args10].length >= 2 && normalizeText(value35).endsWith(args10)),
  );
}
export function extractStorySourceDialogueSpeakers(value36 = '', value37 = []) {
  const list13 = [];
  return (
    normalizeText(value36)
      .split(/\r?\n/u)
      .forEach((value38) => {
        const value39 = value38.match(
            /^[\s>*#-]*(?:【)?([\p{Script=Han}A-Za-z0-9·•._-]{1,12})(?:】)?(?:[（(][^（）()\r\n]{0,30}[）)])?(?:\*\*)?\s*[:：]/u,
          ),
          storySourceDialogueSpeaker = normalizeStorySourceDialogueSpeaker(value39?.[1]);
        isLikelyStorySourceDialogueSpeaker(storySourceDialogueSpeaker, value37) &&
          !isDeclaredStorySourceSpeakerAlias(storySourceDialogueSpeaker, value37) &&
          list13.push(storySourceDialogueSpeaker);
      }),
    normalizeStringArray(list13)
  );
}
export function extractStorySourceCharacterNames({ characters: characters = [], body: body = '' } = {}) {
  const args11 = normalizeSourceCharacters([
    ...normalizeStringArray(characters).map(normalizeSourceCharacterName).filter(Boolean),
    ...extractStorySourceCastNames(body),
  ]);
  return normalizeSourceCharacters([...args11, ...extractStorySourceDialogueSpeakers(body, args11)]);
}
export function normalizeStoryAssetExtractionSources(list14 = []) {
  const list15 = [];
  (Array.isArray(list14) ? list14 : []).forEach((value40, value41) => {
    const episodeRef = normalizeReference(
        value40?.id || value40?.ref || value40?.planningRef,
        'episode-' + (value41 + 1),
      ),
      episodeNumber = Math.max(1, Math.trunc(Number(value40?.number) || value41 + 1));
    (Array.isArray(value40?.script?.scenes) ? value40.script.scenes : []).forEach(
      (characters2, value42) => {
        const heading = normalizeText(characters2?.heading),
          body2 = normalizeText(characters2?.body);
        if (!heading || !body2) return;
        const localRef = normalizeReference(characters2?.ref, episodeRef + '-scene-' + (value42 + 1)),
          characters3 = extractStorySourceCharacterNames({
            characters: characters2?.characters,
            body: body2,
          });
        list15.push({
          episodeRef: episodeRef,
          episodeNumber: episodeNumber,
          localRef: localRef,
          heading: heading,
          assetHeading: heading,
          source: normalizeText(characters2?.source),
          isSourceWindow: false,
          characters: characters3,
          body: body2,
        });
      },
    );
  });
  const ref2 = list15.reduce((map4, value43) => {
      return (map4.set(value43.localRef, (map4.get(value43.localRef) || 0) + 1), map4);
    }, new Map()),
    list16 = list15.map((episodeRef2) => ({
      ref:
        ref2.get(episodeRef2.localRef) > 1
          ? episodeRef2.episodeRef + ':' + episodeRef2.localRef
          : episodeRef2.localRef,
      episodeRef: episodeRef2.episodeRef,
      episodeNumber: episodeRef2.episodeNumber,
      heading: episodeRef2.heading,
      assetHeading: episodeRef2.assetHeading || episodeRef2.heading,
      source: episodeRef2.source,
      isSourceWindow: Boolean(episodeRef2.isSourceWindow),
      characters: episodeRef2.characters,
      body: episodeRef2.body,
    }));
  if (!list16.length) throw new Error('资产提取没有找到可用的分集场次正文。');
  return list16;
}
