import { generateText } from './aiTextApi.js';
import { withReplicationRequestPolicy } from './story-generation/storyRequestPolicy.js';
import { STORY_ASSET_VOICE_DESCRIPTION_RULE } from './story-generation/storyAssetVoicePolicy.js';
import { parseStrictJson } from './utils/strictJson.js';
import {
  getStorySceneIdentityKey,
  normalizeStorySceneHeadingIdentity,
  storySceneIdentitiesOverlap,
} from './utils/storySceneIdentity.js';
import {
  sanitizeStoryAssetPublicPromptText,
  stripStoryAssetInternalEvidenceMetadata,
} from './utils/storyAssetPublicText.js';
import {
  STORY_ASSET_EXTRACTION_SCHEMA_VERSION,
  parseStoryAssetExtractionResult,
} from './storyGenerationApi.js';
import { createStoryAssetCandidateLedger } from './storyAssetCandidateLedger.js';
import { createStoryAssetEvidenceDossiers } from './storyAssetEvidenceDossier.js';
import { createStoryAssetActionPropCandidates } from './story-generation/storyAssetRequirementEvidence.js';
import { STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS } from './story-generation/storyAssetHybridBudget.js';
export const STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION = 7;
export const STORY_ASSET_INVENTORY_PROMPT_TARGET_CHARACTERS = 20000;
export const STORY_ASSET_INVENTORY_REPAIR_REQUEST_LIMIT = 1;
export const STORY_ASSET_INVENTORY_MAX_SOURCE_SCENES = 50;
export const STORY_ASSET_KIND_BATCH_MAX_SOURCE_SCENES = 30;
export const STORY_ASSET_AUTOMATIC_CALL_LIMIT = 3;
export const STORY_ASSET_BATCH_REQUEST_LIMIT = 16;
export const STORY_ASSET_EXPERIMENTAL_REQUEST_TIMEOUT_MS = 3 * 60 * 1000;
export const STORY_ASSET_SOURCE_WINDOW_TARGET_CHARACTERS = 50000;
export const STORY_ASSET_DETAIL_TARGET_OUTPUT_CHARACTERS = 16000;
export const STORY_ASSET_DETAIL_MAX_OUTPUT_CHARACTERS = 22000;
export const STORY_ASSET_DETAIL_MAX_ASSETS_PER_BATCH = 12;
export const STORY_ASSET_DETAIL_PROMPT_TARGET_CHARACTERS = 18000;
export const STORY_ASSET_EXPERIMENTAL_KINDS = Object.freeze(['character', 'scene', 'prop']);
const STORY_ASSET_DETAIL_SOURCE_BODY_MAX_CHARACTERS = 1200,
  STORY_ASSET_DETAIL_SOURCE_SCENE_MAX_COUNT = 15,
  STORY_ASSET_INVENTORY_SYSTEM_PROMPT = [
    '你是专业的影视资产清单规划 Agent。',
    '客户端已经确定具名角色和逐场原始场景候选；你只补充角色与场景的显著形象状态、跨标题场景归并和关键道具。',
    '场景标题若用“/”“／”等并列多个地点，必须返回去掉时间和内外景前缀后的单一物理空间资产，禁止原样复制复合标题。',
    '当前只规划轻量差异清单和来源映射，不生成声音设定、图片提示词或长篇视觉描述。',
    '同一物理空间出现不同年代、完好与损毁、普通与异变、干燥与积水等明显视觉差异时，必须保留为同一个场景资产并拆成多个 appearances；每个 appearance 明确映射对应 sourceSceneRefs。',
    '角色只有显著换装、年龄变化、受伤或形态变化时才拆 appearances；普通表情和情绪变化不拆形象。',
    '场景的显著年代或物理状态差异必须拆 appearances；普通镜头角度、短暂人物活动或不改变空间视觉基准的氛围变化不拆。道具只能规划一个 appearance。',
    'sceneAudits 必须逐场核验角色候选并列出 characterNames，同时列出关键道具 keyPropNames；没有时返回空数组，名称必须与 assets 中名称完全一致。',
    '只依据输入场次，不续写剧情，不创建分集或分镜。',
    '只返回严格 JSON，不要输出 Markdown、注释或说明。',
  ].join('\n'),
  STORY_ASSET_INVENTORY_REPAIR_SYSTEM_PROMPT = [
    '你是影视资产清单修复 Agent。',
    '只处理输入 coverageIssues 指出的缺失、重复或来源映射错误，不重新规划未报错资产。',
    'upserts 返回需要新增或完整替换的轻量资产；removeAssetRefs 只返回确实需要删除的旧资产 ref。',
    '不得生成声音设定、图片提示词或长篇视觉描述。',
    '只返回严格 JSON，不要输出 Markdown、注释或说明。',
  ].join('\n'),
  STORY_ASSET_DETAIL_SYSTEM_PROMPT = [
    '你是专业的影视资产设定 Agent。',
    '当前只细化输入 assetPlans，不新增、删除、合并或重排资产与形象。',
    '每个资产都提供独立 evidenceDossiers；scriptFacts 只能记录原文证据或已确认项目设定直接支持的事实，不得把推测写成剧情事实。',
    'visualDesign 用于记录生成形象所需但原文没有明确提供的视觉补全；补全必须符合身份、时代、世界观和视觉风格，并且不得与 scriptFacts 冲突。',
    'description 必须明确分成“剧本事实”和“视觉补全”两部分，禁止用视觉补全反向改写人物身份、关系、道具归属或剧情状态。',
    STORY_ASSET_VOICE_DESCRIPTION_RULE,
    '角色图片提示词只用于独立人设图：具体描述脸部、发型、体态、服装、鞋履和必要穿戴细节，采用自然站立的正面全身人物设定图，不写剧情道具、动作表演、地点、家具、其他人物或剧情场面。',
    '最终 prompt 只能写需要呈现的正向视觉内容，不得复述任何规则、限制、处理流程、模型说明或其他元说明措辞。',
    '场景图片提示词必须描述空间布局、结构材质、前中后景、关键陈设、光源色温、时间天气、色彩、视角和景别，并默认无人。',
    '道具图片提示词必须描述用途、轮廓、尺寸、材质工艺、颜色纹样、磨损和关键结构，采用产品设定构图并默认无人手持。',
    '多形象角色必须在每个形象中完整复述稳定的脸部、发型和体态特征，只改变剧情明确要求的外观差异。',
    '只依据输入 sourceScenes 细化，不续写剧情，不创建分集或分镜。',
    '只返回严格 JSON，不要输出 Markdown、注释或说明。',
  ].join('\n');
function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}
function normalizeStringArray(item) {
  return [...new Set((Array.isArray(item) ? item : []).map(normalizeText).filter(Boolean))];
}
function normalizeReference(key, index = '') {
  return normalizeText(key).replace(/\s+/g, '-') || index;
}
function getResultText(response) {
  if (typeof response === 'string') return response;
  return response?.text || response?.outputText || response?.content || response || '';
}
async function requestStrictAgentResult({
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
function normalizeStoryContext(options = {}) {
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
function normalizeSourceCharacters(current) {
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
function normalizeSourceCharacterName(record) {
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
function normalizeDeterministicStoryCharacterCandidate(payload) {
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
function getDeterministicStoryCharacterCandidates(options2 = {}) {
  return normalizeStringArray(
    normalizeStringArray(options2?.characters).map(normalizeDeterministicStoryCharacterCandidate),
  );
}
function getStoryAssetNameAliases(handle) {
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
function storyCharacterNamesOverlap(scope, input) {
  const map = new Set(getStoryAssetNameAliases(input).map((output) => output.toLowerCase()));
  return getStoryAssetNameAliases(scope).some((value2) => map.has(value2.toLowerCase()));
}
function storyCharacterNamesStronglyOverlap(value3, value4) {
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
function addDeterministicStoryCharacterCandidate(map2, value5, value6) {
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
function createDeterministicStoryCharacterCandidateMap(list4 = []) {
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
function resolveDeterministicStoryCharacterCanonicalName(value15, map3) {
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
function getStoryAssetLocalCharacterCanonicalNames(list5 = []) {
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
function resolveStoryAssetCharacterCanonicalName(value22, value23, list6 = []) {
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
function resolveStoryProjectCharacterCanonicalName(value25, list9 = []) {
  return list9.find((value26) => storyCharacterNamesOverlap(value26, value25)) || '';
}
function extractStorySourceCastNames(value27 = '') {
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
function isLikelyStorySourceDialogueSpeaker(args9, list11 = []) {
  if (!args9) return false;
  if (list11.includes(args9)) return true;
  if (list11.some((value32) => args9.startsWith(value32))) return false;
  if ([...args9].length > 6) return false;
  if (/^(?:他|她|它|他们|她们|它们|众人|人群|观众|评论区|弹幕)/u.test(args9)) return false;
  if (/^(?:然后|随后|接着|紧接着|这时|此时)(?:他|她|它)?/u.test(args9)) return false;
  if (/(?:若干|数人|多人|等人)$/u.test(args9)) return false;
  return !/(?:面无表情|面不改色|一把|抓住|咳着|喊出声|已经|炸了|冷笑|苦笑|说道|问道|答道|开口|皱眉|点头|摇头|转身|抬手|挥手|走向|看向|望着|盯着|站起|坐下|推开|握住|拿起|放下)$/u.test(args9);
}
function normalizeStorySourceDialogueSpeaker(value33) {
  const sourceCharacterName2 = normalizeSourceCharacterName(value33)
    .replace(STORY_SOURCE_DIALOGUE_ACTION_SUFFIX_PATTERN, '')
    .trim();
  if (!sourceCharacterName2 || STORY_SOURCE_NONVISUAL_SPEAKER_PATTERN.test(sourceCharacterName2))
    return '';
  return sourceCharacterName2;
}
function isDeclaredStorySourceSpeakerAlias(value34, list12 = []) {
  const args10 = normalizeText(value34);
  if (!args10) return false;
  return list12.some(
    (value35) =>
      storyCharacterNamesOverlap(value35, args10) ||
      ([...args10].length >= 2 && normalizeText(value35).endsWith(args10)),
  );
}
function extractStorySourceDialogueSpeakers(value36 = '', value37 = []) {
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
export function createStoryAssetKindSourceBatches(
  list17 = [],
  { maxSourceScenes: maxSourceScenes = STORY_ASSET_KIND_BATCH_MAX_SOURCE_SCENES } = {},
) {
  const value44 = Math.max(1, Math.trunc(Number(maxSourceScenes) || 0)),
    list18 = [];
  (Array.isArray(list17) ? list17 : []).forEach((value45) => {
    const episodeRef3 = normalizeText(value45?.episodeRef) || 'unknown-episode',
      enabled2 = list18.at(-1);
    if (!enabled2 || enabled2.episodeRef !== episodeRef3) {
      list18.push({ episodeRef: episodeRef3, scenes: [value45] });
      return;
    }
    enabled2.scenes.push(value45);
  });
  const list19 = [];
  let list20 = [];
  const run = () => {
    if (!list20.length) return;
    (list19.push(list20), (list20 = []));
  };
  return (
    list18.forEach(({ scenes: scenes }) => {
      if (scenes.length > value44) {
        run();
        for (let value46 = 0; value46 < scenes.length; value46 += value44) {
          list19.push(scenes.slice(value46, value46 + value44));
        }
        return;
      }
      (list20.length && list20.length + scenes.length > value44 && run(), list20.push(...scenes));
    }),
    run(),
    list19
  );
}
function buildOccurrences(list21 = []) {
  const list22 = normalizeStringArray(list21);
  if (!list22.length) return '当前项目';
  const list23 = list22.map((value47) => {
    const value48 = /(?:^|[-_])episode-(\d+)$/iu.exec(value47);
    return value48 ? String(Math.max(1, Number(value48[1]) || 1)) : '';
  });
  if (list23.every(Boolean)) {
    const list24 = [...new Set(list23.map(Number))].sort((value49, value50) => value49 - value50);
    return '第 ' + list24.join('、') + ' 集';
  }
  return list22.map((value51, value52) =>
    list23[value52] ? '第 ' + list23[value52] + ' 集' : value51,
  ).join('、');
}
function deriveSourceEpisodeRefs(list25, map5) {
  return normalizeStringArray(list25.map((value53) => map5.get(value53)?.episodeRef));
}
function normalizeStoryAssetFinalCharacterRole(value54 = '') {
  const text3 = normalizeText(value54);
  if (/主角|男主|女主|主人公/u.test(text3)) return '主角';
  if (/反派|反面|敌对|敌人|宿敌|对手/u.test(text3)) return '反派';
  if (/路人|群众|群演|背景人物|无名角色/u.test(text3)) return '路人';
  return '配角';
}
function normalizeInventoryAssets(
  value55,
  { sourceScenes: sourceScenes = [], allowEmpty: allowEmpty = false } = {},
) {
  const map6 = new Map(sourceScenes.map((value56) => [value56.ref, value56])),
    map7 = new Set(map6.keys()),
    list26 = (Array.isArray(value55) ? value55 : [])
      .map((error4, value57) => {
        const kind2 = normalizeText(error4?.kind),
          name2 = normalizeText(error4?.name),
          ref3 = normalizeReference(error4?.ref, 'asset-' + (value57 + 1));
        if (!name2 || !['character', 'scene', 'prop'].includes(kind2)) return null;
        const role =
          kind2 === 'character'
            ? normalizeStoryAssetFinalCharacterRole(error4?.role)
            : normalizeText(error4?.role);
        let sourceSceneRefs2 = normalizeStringArray(error4?.sourceSceneRefs).filter((value58) =>
          map7.has(value58),
        );
        !sourceSceneRefs2.length &&
          (sourceSceneRefs2 = inferStoryAssetSourceSceneRefs(kind2, name2, sourceScenes));
        if (!sourceSceneRefs2.length) return null;
        const sourceEpisodeRefs2 = deriveSourceEpisodeRefs(sourceSceneRefs2, map6),
          list27 =
            Array.isArray(error4?.appearances) && error4.appearances.length
              ? error4.appearances
              : [
                  {
                    ref: ref3 + '-base',
                    name: '基础形象',
                    description: '',
                    sourceSceneRefs: sourceSceneRefs2,
                  },
                ],
          list28 =
            kind2 === 'prop' && list27.length > 1
              ? [
                  {
                    ref: ref3 + '-base',
                    name: '基础形象',
                    description: normalizeStringArray(
                      list27.map((error5) => {
                        const text4 = normalizeText(error5?.name),
                          text5 = normalizeText(error5?.description);
                        if (text4 && text5) return text4 + '：' + text5;
                        return text5 || text4;
                      }),
                    ).join('；'),
                    sourceSceneRefs: sourceSceneRefs2,
                  },
                ]
              : list27,
          appearances = list28.map((error6, count2) => {
            const sourceSceneRefs3 = normalizeStringArray(
              error6?.sourceSceneRefs?.length
                ? error6.sourceSceneRefs
                : list28.length === 1
                  ? sourceSceneRefs2
                  : [],
            ).filter((value59) => sourceSceneRefs2.includes(value59));
            return {
              ref: normalizeReference(error6?.ref, ref3 + '-appearance-' + (count2 + 1)),
              name:
                normalizeText(error6?.name) || (count2 === 0 ? '基础形象' : '形象 ' + (count2 + 1)),
              description: normalizeText(error6?.description),
              occurrences: buildOccurrences(deriveSourceEpisodeRefs(sourceSceneRefs3, map6)),
              sourceEpisodeRefs: deriveSourceEpisodeRefs(sourceSceneRefs3, map6),
              sourceSceneRefs: sourceSceneRefs3,
            };
          }),
          list29 = appearances.map((value60) => value60.ref);
        if (new Set(list29).size !== list29.length)
          throw new Error('资产“' + name2 + '”规划了重复的形象 ref。');
        return {
          ref: ref3,
          kind: kind2,
          name: name2,
          role: role,
          description: normalizeText(error4?.description),
          occurrences: normalizeText(error4?.occurrences) || buildOccurrences(sourceEpisodeRefs2),
          sourceEpisodeRefs: sourceEpisodeRefs2,
          sourceSceneRefs: sourceSceneRefs2,
          appearances: appearances,
        };
      })
      .filter(Boolean);
  if (!list26.length && !allowEmpty) throw new Error('Agent 未返回可用的轻量资产清单。');
  const value61 = new Set();
  return (
    list26.forEach((value62, value63) => {
      value62.ref = createUniqueStoryAssetInventoryRef(
        value62.ref,
        value61,
        'asset-' + (value63 + 1),
      );
      const value64 = new Set();
      value62.appearances.forEach((value65, value66) => {
        value65.ref = createUniqueStoryAssetAppearanceRef(
          value65.ref,
          value64,
          value62.ref + '-appearance-' + (value66 + 1),
        );
      });
    }),
    list26
  );
}
export function buildStoryAssetInventoryPrompt({
  project: project = {},
  episodes: episodes = [],
  sourceScenes: sourceScenes = null,
} = {}) {
  const storyContext2 = normalizeStoryContext(project),
    list30 = Array.isArray(sourceScenes) ? sourceScenes : normalizeStoryAssetExtractionSources(episodes);
  if (!list30.length) throw new Error('资产清单规划缺少可用的场次正文。');
  const map8 = createDeterministicStoryCharacterCandidateMap(list30),
    sourceScenes2 = list30.map((ref4) => ({
      ref: ref4.ref,
      heading: ref4.heading,
      ...(ref4.isSourceWindow
        ? { assetHeading: ref4.assetHeading || ref4.heading, isSourceWindow: true }
        : {}),
      ...(ref4.characters.length ? { characters: ref4.characters } : {}),
      body: ref4.body,
    }));
  return JSON.stringify({
    task: 'plan_story_asset_inventory',
    schemaVersion: STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION,
    storyContext: storyContext2,
    deterministicCandidates: {
      characters: [...map8.entries()].map(([name3, value67]) => ({
        name: name3,
        sourceSceneRefs: normalizeStringArray(value67.sourceSceneRefs),
      })),
    },
    sourceScenes: sourceScenes2,
    requirements: [
      '本轮只输出必要补充：角色或场景的显著形象状态、需要跨标题合并的场景组、关键道具；没有补充时 assets 返回空数组。',
      '不要逐项复述只有基础形象的角色或普通单场场景；客户端会从 deterministicCandidates.characters 和 sourceScenes 本地补齐。',
      'sourceScenes[].isSourceWindow 为 true 时，它只是同一场正文的传输片段；按 assetHeading 视为同一场景，不得为每个片段新建场景资产。',
      'assets 只包含 kind、name、role、sourceSceneRefs、appearances；角色或场景存在显著形象变化时 appearances 返回形象项（只含 name、description、sourceSceneRefs），其余返回空数组。ref、出现集数、声音和图片 prompt 全部由客户端或后续步骤处理。',
      'storyContext.characters[].fixedTraits 与 continuityFacts 是已确认约束；不得改写人物身份、身体限制、关系或物品归属。',
      '需要归并的 scene 资产必须完整列出它覆盖的 sourceScenes[].ref；同一物理空间即使视觉状态不同也归入同一 scene 资产，通过 appearances 区分状态。',
      'sourceScenes[].heading 若用“/”“／”等并列多个地点，必须至少返回一个明确覆盖该 sourceSceneRef 的原子 scene 资产；scene.name 只能是单一物理空间名称，禁止复制复合标题。',
      '只有存在显著换装、年龄、受伤或形态变化时才返回同名 character 资产及 appearances。',
      'sceneAudits 必须完整覆盖全部 sourceScenes；characterNames 逐场核验 sourceScenes[].characters，只保留原文中确实出现且需要角色资产的具名人物或明确身份角色；不得保留“无相应实体”、句子片段或动作描述。',
      'sceneAudits[].keyPropNames 只列需要跨镜头保持视觉一致的剧情关键道具，且名称与 prop 资产完全一致。',
      '同一物理空间在不同年代、完好/损毁、正常/异变、干燥/积水等明显视觉状态下必须拆成多个 scene appearances；普通镜头角度、短暂人物活动或不改变空间视觉基准的氛围变化不拆。',
      'prop 的 appearances 必须返回空数组，客户端会创建唯一基础形象；scene 有显著状态差异时必须返回多个 appearances。',
      '每个资产、角色 appearance 和场景 appearance 的 sourceSceneRefs 只能逐字引用 sourceScenes[].ref；sourceEpisodeRefs 由客户端根据场次确定，无需输出。',
    ],
  });
}
export function createStoryAssetInventorySourceBatches({
  project: project = {},
  episodes: episodes = [],
  sourceScenes: sourceScenes = null,
  maxPromptCharacters: maxPromptCharacters = STORY_ASSET_INVENTORY_PROMPT_TARGET_CHARACTERS,
  maxSourceScenes: maxSourceScenes = STORY_ASSET_INVENTORY_MAX_SOURCE_SCENES,
} = {}) {
  const list31 = Array.isArray(sourceScenes)
      ? sourceScenes
      : normalizeStoryAssetExtractionSources(episodes),
    value68 = Math.max(4000, Math.trunc(Number(maxPromptCharacters) || 0)),
    value69 = Math.max(1, Math.trunc(Number(maxSourceScenes) || 0)),
    list32 = [];
  let list33 = [];
  list31.forEach((value70) => {
    const sourceScenes3 = [...list33, value70],
      storyAssetInventoryPrompt = buildStoryAssetInventoryPrompt({
        project: project,
        sourceScenes: sourceScenes3,
      }).length;
    if (list33.length && (list33.length >= value69 || storyAssetInventoryPrompt > value68)) {
      (list32.push(list33), (list33 = [value70]));
      return;
    }
    list33 = sourceScenes3;
  });
  if (list33.length) list32.push(list33);
  const value71 = list32.find(
    (sourceScenes4) =>
      buildStoryAssetInventoryPrompt({ project: project, sourceScenes: sourceScenes4 }).length > value68,
  );
  if (value71) {
    const value72 = value71[0];
    throw new Error(
      '单个场次“' +
        (value72?.heading || value72?.ref || '未命名场次') +
        '”正文过长，请先拆分该场次。',
    );
  }
  return list32;
}
export function parseStoryAssetInventoryResult(value73, { sourceScenes: sourceScenes = [] } = {}) {
  const strictJson = parseStrictJson(getResultText(value73), 'Agent 未返回轻量资产清单。'),
    assets = normalizeInventoryAssets(strictJson?.assets, {
      sourceScenes: sourceScenes,
      allowEmpty: true,
    }),
    map9 = new Set(sourceScenes.map((value74) => value74.ref)),
    list34 = (Array.isArray(strictJson?.sceneAudits) ? strictJson.sceneAudits : []).map(
      (value75) => ({
        sourceSceneRef: normalizeText(
          value75?.sourceSceneRef || value75?.sceneRef || value75?.ref,
        ),
        characterNames: normalizeStringArray(value75?.characterNames),
        keyPropNames: normalizeStringArray(value75?.keyPropNames),
      }),
    ),
    list35 = list34.map((value76) => value76.sourceSceneRef),
    value77 = list35.find((value78) => !map9.has(value78));
  if (value77) throw new Error('场次审计引用了不存在的场次：' + value77 + '。');
  if (new Set(list35).size !== list35.length) throw new Error('场次审计包含重复的 sourceSceneRef。');
  const map10 = new Map(list34.map((value79) => [value79.sourceSceneRef, value79])),
    sceneAudits = sourceScenes.map((sourceSceneRef2) => ({
      sourceSceneRef: sourceSceneRef2.ref,
      characterNames: normalizeStringArray([
        ...(map10.get(sourceSceneRef2.ref)?.characterNames || []),
        ...assets.filter(
          (value80) =>
            value80.kind === 'character' && value80.sourceSceneRefs.includes(sourceSceneRef2.ref),
        ).map((error7) => error7.name),
      ]),
      keyPropNames: normalizeStringArray([
        ...(map10.get(sourceSceneRef2.ref)?.keyPropNames || []),
        ...assets.filter(
          (value81) =>
            value81.kind === 'prop' && value81.sourceSceneRefs.includes(sourceSceneRef2.ref),
        ).map((error8) => error8.name),
      ]),
    }));
  return {
    schemaVersion: STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION,
    assets: assets,
    sceneAudits: sceneAudits,
  };
}
function getStoryAssetInventoryIdentity(error9 = {}) {
  return normalizeText(error9?.kind) + ':' + normalizeText(error9?.name).toLowerCase();
}
function resolveMergedStoryCharacterRole(value82 = '', value83 = '') {
  const list36 = [
    normalizeStoryAssetFinalCharacterRole(value82),
    normalizeStoryAssetFinalCharacterRole(value83),
  ];
  if (list36.includes('主角')) return '主角';
  if (list36.includes('反派')) return '反派';
  if (list36.includes('配角')) return '配角';
  return '路人';
}
function createUniqueStoryAssetInventoryRef(value84, map11, value85) {
  const reference = normalizeReference(value84, value85);
  let value86 = reference,
    value87 = 2;
  while (map11.has(value86)) {
    ((value86 = reference + '-' + value87), (value87 += 1));
  }
  return (map11.add(value86), value86);
}
function createUniqueStoryAssetAppearanceRef(value88, map12, value89) {
  const reference2 = normalizeReference(value88, value89);
  if (!map12.has(reference2)) return (map12.add(reference2), reference2);
  return createUniqueStoryAssetInventoryRef(value89, map12, value89);
}
function mergeStoryAssetInventoryAppearance(args12, args13) {
  return (
    (args12.description = args12.description || args13.description),
    (args12.sourceSceneRefs = normalizeStringArray([
      ...args12.sourceSceneRefs,
      ...args13.sourceSceneRefs,
    ])),
    args12
  );
}
export function mergeStoryAssetInventoryResults(list37 = [], { sourceScenes: sourceScenes = [] } = {}) {
  const assets2 = [],
    map13 = new Map(),
    map14 = new Map();
  (Array.isArray(list37) ? list37 : []).forEach((value90) => {
    ((Array.isArray(value90?.assets) ? value90.assets : []).forEach((appearances2) => {
      const storyAssetInventoryIdentity = getStoryAssetInventoryIdentity(appearances2),
        args14 = map13.get(storyAssetInventoryIdentity);
      if (!args14) {
        const value91 = {
          ...appearances2,
          sourceSceneRefs: [...appearances2.sourceSceneRefs],
          appearances: appearances2.appearances.map((args15) => ({
            ...args15,
            sourceSceneRefs: [...args15.sourceSceneRefs],
          })),
        };
        (map13.set(storyAssetInventoryIdentity, value91), assets2.push(value91));
        return;
      }
      ((args14.description = args14.description || appearances2.description),
        (args14.sourceSceneRefs = normalizeStringArray([
          ...args14.sourceSceneRefs,
          ...appearances2.sourceSceneRefs,
        ])));
      if (args14.kind === 'character')
        args14.role = resolveMergedStoryCharacterRole(args14.role, appearances2.role);
      else {
        if (args14.kind === 'prop') {
          const value92 = args14.appearances[0];
          appearances2.appearances.forEach((value93) => {
            mergeStoryAssetInventoryAppearance(value92, value93);
          });
          return;
        }
      }
      appearances2.appearances.forEach((error10) => {
        const text6 = normalizeText(error10.name).toLowerCase(),
          value94 = args14.appearances.find(
            (error11) => normalizeText(error11.name).toLowerCase() === text6,
          );
        value94
          ? mergeStoryAssetInventoryAppearance(value94, error10)
          : args14.appearances.push({
              ...error10,
              sourceSceneRefs: [...error10.sourceSceneRefs],
            });
      });
    }),
      (Array.isArray(value90?.sceneAudits) ? value90.sceneAudits : []).forEach((value95) => {
        const sourceSceneRef3 = normalizeText(value95?.sourceSceneRef);
        if (!sourceSceneRef3) return;
        const args16 = map14.get(sourceSceneRef3) || {
          sourceSceneRef: sourceSceneRef3,
          characterNames: [],
          keyPropNames: [],
        };
        ((args16.characterNames = normalizeStringArray([
          ...args16.characterNames,
          ...normalizeStringArray(value95?.characterNames),
        ])),
          (args16.keyPropNames = normalizeStringArray([
            ...args16.keyPropNames,
            ...normalizeStringArray(value95?.keyPropNames),
          ])),
          map14.set(sourceSceneRef3, args16));
      }));
  });
  const value96 = new Set(),
    value97 = new Set();
  return (
    assets2.forEach((value98, value99) => {
      ((value98.ref = createUniqueStoryAssetInventoryRef(
        value98.ref,
        value96,
        'asset-' + (value99 + 1),
      )),
        (value98.appearances = value98.appearances.map((args17, value100) => ({
          ...args17,
          ref: createUniqueStoryAssetAppearanceRef(
            args17.ref,
            value97,
            value98.ref + '-appearance-' + (value100 + 1),
          ),
        }))));
    }),
    parseStoryAssetInventoryResult(
      { assets: assets2, sceneAudits: [...map14.values()] },
      { sourceScenes: sourceScenes },
    )
  );
}
function pushCoverageIssue(list38, value101) {
  const value102 = JSON.stringify(value101);
  if (!list38.some((value103) => JSON.stringify(value103) === value102)) list38.push(value101);
}
export function inspectStoryAssetInventoryCoverage(options3 = {}, list39 = []) {
  const list40 = Array.isArray(options3?.assets) ? options3.assets : [],
    map15 = new Map(
      (Array.isArray(options3?.sceneAudits) ? options3.sceneAudits : []).map((value104) => [
        value104.sourceSceneRef,
        value104,
      ]),
    ),
    value105 = [];
  return (
    list39.forEach((sourceSceneRef4) => {
      const type = list40.filter(
          (value106) =>
            value106.kind === 'scene' && value106.sourceSceneRefs.includes(sourceSceneRef4.ref),
        ),
        enabled3 = /[/／|｜]/u.test(
          normalizeText(sourceSceneRef4?.assetHeading || sourceSceneRef4?.heading),
        );
      ((!type.length || (!enabled3 && type.length > 1)) &&
        pushCoverageIssue(value105, {
          type: type.length ? 'duplicate-scene-assets' : 'missing-scene-asset',
          sourceSceneRef: sourceSceneRef4.ref,
          expectedName: sourceSceneRef4.heading,
          assetRefs: type.map((value107) => value107.ref),
        }),
        (map15.get(sourceSceneRef4.ref)?.keyPropNames || []).forEach((expectedName) => {
          const type2 = list40.filter(
            (error12) =>
              error12.kind === 'prop' &&
              error12.name === expectedName &&
              error12.sourceSceneRefs.includes(sourceSceneRef4.ref),
          );
          type2.length !== 1 &&
            pushCoverageIssue(value105, {
              type: type2.length ? 'duplicate-key-props' : 'missing-key-prop',
              sourceSceneRef: sourceSceneRef4.ref,
              expectedName: expectedName,
              assetRefs: type2.map((value108) => value108.ref),
            });
        }),
        (map15.get(sourceSceneRef4.ref)?.characterNames || []).forEach((expectedName2) => {
          const type3 = list40.filter(
            (error13) =>
              error13.kind === 'character' &&
              storyCharacterNamesOverlap(error13.name, expectedName2) &&
              error13.sourceSceneRefs.includes(sourceSceneRef4.ref),
          );
          type3.length !== 1 &&
            pushCoverageIssue(value105, {
              type: type3.length ? 'duplicate-scene-characters' : 'missing-scene-character',
              sourceSceneRef: sourceSceneRef4.ref,
              expectedName: expectedName2,
              assetRefs: type3.map((value109) => value109.ref),
            });
        }));
    }),
    list40.forEach((expectedName3) => {
      expectedName3.sourceSceneRefs.forEach((sourceSceneRef5) => {
        const appearanceRefs = expectedName3.appearances
          .filter((value110) => value110.sourceSceneRefs.includes(sourceSceneRef5))
          .map((value111) => value111.ref);
        !appearanceRefs.length &&
          pushCoverageIssue(value105, {
            type: 'missing-appearance-mapping',
            sourceSceneRef: sourceSceneRef5,
            expectedName: expectedName3.name,
            assetRefs: [expectedName3.ref],
            appearanceRefs: appearanceRefs,
          });
      });
    }),
    value105
  );
}
export function buildStoryAssetInventoryRepairPrompt({
  inventory: inventory = {},
  sourceScenes: sourceScenes = [],
  coverageIssues: coverageIssues = [],
} = {}) {
  const map16 = new Set(coverageIssues.map((value112) => value112.sourceSceneRef)),
    map17 = new Set(coverageIssues.flatMap((value113) => value113.assetRefs || [])),
    sourceScenes5 = sourceScenes.filter((value114) => map16.has(value114.ref)),
    currentAssets = (inventory.assets || []).filter(
      (value115) =>
        map17.has(value115.ref) ||
        value115.sourceSceneRefs.some((value116) => map16.has(value116)),
    );
  return JSON.stringify({
    task: 'repair_story_asset_inventory_coverage',
    schemaVersion: STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION,
    coverageIssues: coverageIssues,
    sourceScenes: sourceScenes5,
    currentAssets: currentAssets,
    requirements: [
      '只修复 coverageIssues；未在 currentAssets 中出现且未被问题点名的资产不得改动。',
      '缺失项用 upserts 新增；来源映射错误用同 ref 的完整资产覆盖；确需删除的重复资产写入 removeAssetRefs。',
      '仍然只返回轻量资产，不生成 voiceDescription 或图片 prompt。',
    ],
    outputSchema: {
      upserts: [
        {
          ref: '新增或需要替换的资产 ref',
          kind: 'character、scene 或 prop',
          name: '资产名称',
          role: '角色为主角、配角、反派或路人',
          description: '简短用途说明',
          sourceSceneRefs: ['sourceScenes[].ref'],
          appearances: [
            {
              ref: '形象 ref',
              name: '形象状态',
              description: '状态差异',
              sourceSceneRefs: ['sourceScenes[].ref'],
            },
          ],
        },
      ],
      removeAssetRefs: ['需要删除的 currentAssets[].ref'],
    },
  });
}
function createStoryAssetInventoryRepairBatches({
  inventory: inventory = {},
  sourceScenes: sourceScenes = [],
  coverageIssues: coverageIssues = [],
  maxPromptCharacters: maxPromptCharacters = STORY_ASSET_INVENTORY_PROMPT_TARGET_CHARACTERS,
} = {}) {
  const value117 = Math.max(4000, Math.trunc(Number(maxPromptCharacters) || 0)),
    list41 = [];
  let list42 = [];
  coverageIssues.forEach((value118) => {
    const coverageIssues2 = [...list42, value118],
      storyAssetInventoryRepairPrompt = buildStoryAssetInventoryRepairPrompt({
        inventory: inventory,
        sourceScenes: sourceScenes,
        coverageIssues: coverageIssues2,
      }).length;
    if (list42.length && storyAssetInventoryRepairPrompt > value117) {
      (list41.push(list42), (list42 = [value118]));
      return;
    }
    list42 = coverageIssues2;
  });
  if (list42.length) list41.push(list42);
  return list41;
}
function parseStoryAssetInventoryRepairResult(
  value119,
  { sourceScenes: sourceScenes = [], inventory: inventory = {} } = {},
) {
  const strictJson2 = parseStrictJson(getResultText(value119), 'Agent 未返回资产清单修复结果。'),
    upserts = normalizeInventoryAssets(strictJson2?.upserts, {
      sourceScenes: sourceScenes,
      allowEmpty: true,
    }),
    map18 = new Set((inventory.assets || []).map((value120) => value120.ref)),
    removeAssetRefs = normalizeStringArray(strictJson2?.removeAssetRefs),
    value121 = removeAssetRefs.find((value122) => !map18.has(value122));
  if (value121) throw new Error('资产清单修复尝试删除不存在的资产：' + value121 + '。');
  if (!upserts.length && !removeAssetRefs.length) throw new Error('资产清单修复没有返回任何改动。');
  return { upserts: upserts, removeAssetRefs: removeAssetRefs };
}
function applyStoryAssetInventoryRepair(args18, value123) {
  const map19 = new Set(value123.removeAssetRefs || []),
    map20 = new Map((value123.upserts || []).map((value124) => [value124.ref, value124])),
    assets3 = (args18.assets || [])
      .filter((value125) => !map19.has(value125.ref))
      .map((value126) => map20.get(value126.ref) || value126),
    map21 = new Set(assets3.map((value127) => value127.ref));
  return (
    (value123.upserts || []).forEach((value128) => {
      !map21.has(value128.ref) && (assets3.push(value128), map21.add(value128.ref));
    }),
    { ...args18, assets: assets3 }
  );
}
export function createStoryAssetExtractionBatches(
  list43 = [],
  {
    targetOutputCharacters: targetOutputCharacters = STORY_ASSET_DETAIL_TARGET_OUTPUT_CHARACTERS,
    maxOutputCharacters: maxOutputCharacters = STORY_ASSET_DETAIL_MAX_OUTPUT_CHARACTERS,
    maxAssetsPerBatch: maxAssetsPerBatch = STORY_ASSET_DETAIL_MAX_ASSETS_PER_BATCH,
    estimateByKind: estimateByKind = {},
  } = {},
) {
  const list44 = Array.isArray(list43) ? list43 : [];
  if (!list44.length) return [];
  const value129 = Math.max(4000, Math.trunc(Number(targetOutputCharacters) || 0)),
    value130 = Math.max(value129, Math.trunc(Number(maxOutputCharacters) || 0)),
    value131 = Math.max(1, Math.trunc(Number(maxAssetsPerBatch) || 0)),
    value132 = { character: 2200, scene: 1200, prop: 1200 },
    handler = (options4 = {}) => {
      const text7 = normalizeText(options4?.kind),
        value133 = Math.max(
          600,
          Math.trunc(Number(estimateByKind?.[text7]) || value132[text7] || 1400),
        ),
        value134 = Math.max(
          1,
          Array.isArray(options4?.appearances) ? options4.appearances.length : 1,
        );
      return Math.min(value130, value133 + Math.max(0, value134 - 1) * 1100);
    },
    list45 = [];
  let list46 = [],
    value135 = 0;
  list44.forEach((value136) => {
    const value137 = handler(value136);
    (list46.length &&
      (list46.length >= value131 || value135 + value137 > value129) &&
      (list45.push(list46), (list46 = []), (value135 = 0)),
      list46.push(value136),
      (value135 += value137),
      value135 >= value130 && (list45.push(list46), (list46 = []), (value135 = 0)));
  });
  if (list46.length) list45.push(list46);
  return list45;
}
function compactStoryAssetDetailSourceBody(value138 = '') {
  const args19 = normalizeText(value138);
  if ([...args19].length <= STORY_ASSET_DETAIL_SOURCE_BODY_MAX_CHARACTERS) return args19;
  const args20 = '\n……\n',
    value139 = Math.max(1, STORY_ASSET_DETAIL_SOURCE_BODY_MAX_CHARACTERS - [...args20].length),
    value140 = Math.floor(value139 * 0.7),
    value141 = value139 - value140;
  return (
    '' +
    [...args19].slice(0, value140).join('') +
    args20 +
    [...args19].slice(-value141).join('')
  );
}
function selectStoryAssetDetailSourceScenes(list47 = [], list48 = []) {
  const map22 = new Set(),
    handler2 = (value142) => {
      const text8 = normalizeText(value142);
      if (!text8 || map22.size >= STORY_ASSET_DETAIL_SOURCE_SCENE_MAX_COUNT) return;
      map22.add(text8);
    };
  return (
    list47.forEach((value143) => handler2(value143.sourceSceneRefs[0])),
    list47.forEach((value144) => {
      value144.appearances.forEach((value145) => handler2(value145.sourceSceneRefs[0]));
    }),
    list47.forEach((value146) => handler2(value146.sourceSceneRefs.at(-1))),
    list48.filter((value147) => map22.has(value147.ref)).map((dom) => ({
      ...dom,
      body: compactStoryAssetDetailSourceBody(dom.body),
    }))
  );
}
export function buildStoryAssetDetailBatchPrompt({
  project: project = {},
  sourceScenes: sourceScenes = [],
  batches: batches = [],
  batchIndex: batchIndex = 0,
  aspectRatio: aspectRatio = '',
  visualStyle: visualStyle = '',
} = {}) {
  const title = normalizeStoryContext(project),
    list49 = Array.isArray(batches?.[batchIndex]) ? batches[batchIndex] : [];
  if (!list49.length) throw new Error('资产提取缺少当前细化批次。');
  const assetPlans2 = list49.map((ref5) => ({
      ref: ref5.ref,
      kind: ref5.kind,
      name: ref5.name,
      role: ref5.role,
      appearances: ref5.appearances.map((ref6) => ({
        ref: ref6.ref,
        name: ref6.name,
      })),
    })),
    evidenceDossiers = createStoryAssetEvidenceDossiers(list49, sourceScenes, { includeSourceMappings: false }),
    style = normalizeText(visualStyle) || title.visualStyle;
  return JSON.stringify({
    task: 'detail_story_asset_batch',
    schemaVersion: STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION,
    batch: { index: batchIndex + 1, total: batches.length },
    storyContext: {
      title: title.title,
      storyType: title.storyType,
      summary: title.summary,
      background: title.background,
      setting: title.setting,
      continuityFacts: title.continuityFacts,
      characters: title.characters,
    },
    visualDirection: {
      aspectRatio: normalizeText(aspectRatio) || title.aspectRatio,
      style: style,
    },
    assetPlans: assetPlans2,
    evidenceDossiers: evidenceDossiers,
    requirements: [
      '严格按 assetPlans 顺序返回同 ref 的全部资产，不得新增、删除、合并或重排。',
      '严格按每个 assetPlans[].appearances 顺序返回同 ref 的全部形象，不得改变来源映射。',
      'storyContext.characters[].fixedTraits 与 continuityFacts 优先于自由视觉设计，任何资产设定都不得与其冲突。',
      '逐项阅读与 assetPlans[].ref 对应的 evidenceDossiers[].evidence；不需要也不得索取完整剧本。',
      'scriptFacts 只写证据明确支持的身份、外观、关系、归属、空间结构或状态；证据没写的内容不得放入 scriptFacts。',
      '为了形成可直接生成的完整形象，可以在 visualDesign 中合理补足年龄外观、五官、发型、服装细节、配色、材质或空间视觉细节。',
      'description 必须由“剧本事实：...”和“视觉补全：...”组成；没有明确事实或无需补全时对应部分写“未明确”或“无需补全”。',
      STORY_ASSET_VOICE_DESCRIPTION_RULE,
      '每个 appearance.prompt 必须信息充分、可直接用于图片生成。',
      '角色 prompt 必须聚焦脸部、发型、体态、服装、鞋履和必要穿戴细节，采用自然站立的正面全身独立人设图，不写剧情道具、动作表演或场景环境。',
      '最终 prompt 只写正向视觉内容，不复述任何规则、限制、处理流程、模型说明或其他元说明措辞。',
      '场景 prompt 默认无人；道具 prompt 默认无人手持。',
      style
        ? '每个 appearance.prompt 必须逐字以 visualDirection.style 的完整内容开头。'
        : '图片提示词保持统一视觉方向。',
    ],
    outputSchema: {
      assets: [
        {
          ref: '逐字使用 assetPlans[].ref',
          scriptFacts: '仅由原文证据和已确认项目设定直接支持的事实',
          visualDesign: '为生成完整视觉资产而增加、且不与事实冲突的设计补全',
          voiceDescription: STORY_ASSET_VOICE_DESCRIPTION_RULE,
          appearances: [
            {
              ref: '逐字使用 assetPlans[].appearances[].ref',
              scriptFacts: '该形象由证据直接支持的事实或状态差异',
              visualDesign: '该形象为生成图片增加的视觉设计',
              prompt: '可直接用于图片生成的中文提示词',
            },
          ],
        },
      ],
    },
  });
}
export function createStoryAssetDetailPromptBatches(
  list50 = [],
  {
    project: project = {},
    sourceScenes: sourceScenes = [],
    aspectRatio: aspectRatio = '',
    visualStyle: visualStyle = '',
    estimateByKind: estimateByKind = {},
    maxPromptCharacters: maxPromptCharacters = STORY_ASSET_DETAIL_PROMPT_TARGET_CHARACTERS,
  } = {},
) {
  const value148 = Math.max(8000, Math.trunc(Number(maxPromptCharacters) || 0)),
    list51 = createStoryAssetExtractionBatches(list50, { estimateByKind: estimateByKind }),
    list52 = [];
  return (
    list51.forEach((list53) => {
      let list54 = [];
      list53.forEach((error14) => {
        const value149 = [...list54, error14],
          storyAssetDetailBatchPrompt = buildStoryAssetDetailBatchPrompt({
            project: project,
            sourceScenes: sourceScenes,
            batches: [value149],
            batchIndex: 0,
            aspectRatio: aspectRatio,
            visualStyle: visualStyle,
          }).length;
        if (list54.length && storyAssetDetailBatchPrompt > value148) {
          (list52.push(list54), (list54 = [error14]));
          const storyAssetDetailBatchPrompt2 = buildStoryAssetDetailBatchPrompt({
            project: project,
            sourceScenes: sourceScenes,
            batches: [list54],
            batchIndex: 0,
            aspectRatio: aspectRatio,
            visualStyle: visualStyle,
          }).length;
          if (storyAssetDetailBatchPrompt2 > value148)
            throw new Error(
              '资产“' +
                error14.name +
                '”的证据档案达到 ' +
                storyAssetDetailBatchPrompt2 +
                ' 字，超过单批 ' +
                value148 +
                ' 字上限。',
            );
          return;
        }
        if (storyAssetDetailBatchPrompt > value148)
          throw new Error(
            '资产“' +
              error14.name +
              '”的证据档案达到 ' +
              storyAssetDetailBatchPrompt +
              ' 字，超过单批 ' +
              value148 +
              ' 字上限。',
          );
        list54 = value149;
      });
      if (list54.length) list52.push(list54);
    }),
    list52
  );
}
const STORY_ASSET_VOICE_DESCRIPTION_FIELDS = Object.freeze([
  '年龄',
  '性别',
  '身份',
  '口音',
  '情绪底色',
  '声线',
  '语速',
  '说话方式',
  '音色特征',
]);
function normalizeStoryAssetNaturalVoiceDescription(value150) {
  const enabled4 = value150 && typeof value150 === 'object' && !Array.isArray(value150) ? value150 : null,
    text9 = normalizeText(value150);
  if (!text9 && !enabled4) return '';
  try {
    const value151 = enabled4 || JSON.parse(text9);
    if (value151 && typeof value151 === 'object' && !Array.isArray(value151)) {
      const value152 = {
        年龄: normalizeText(value151['年龄'] || value151.age),
        性别: normalizeText(value151['性别'] || value151.gender),
        身份: normalizeText(value151['身份'] || value151.identity),
        口音: normalizeText(value151['口音'] || value151.accent),
        情绪底色: normalizeText(
          value151['情绪底色'] || value151.emotionalBase || value151.emotionalTone,
        ),
        声线: normalizeText(
          value151['声线'] || value151.voiceTexture || value151.voiceType || value151.voice,
        ),
        语速: normalizeText(value151['语速'] || value151.voiceSpeed || value151.speed),
        说话方式: normalizeText(
          value151['说话方式'] ||
            value151.speechPattern ||
            value151.speechManner ||
            value151.speakingStyle,
        ),
        音色特征: normalizeText(value151['音色特征'] || value151.timbre || value151.toneColor),
      };
      if (STORY_ASSET_VOICE_DESCRIPTION_FIELDS.some((value153) => value152[value153]))
        return STORY_ASSET_VOICE_DESCRIPTION_FIELDS.filter((value154) => value152[value154])
          .map((value155) => value155 + '：' + value152[value155])
          .join('；');
    }
  } catch {}
  if (!text9) return '';
  if (
    STORY_ASSET_VOICE_DESCRIPTION_FIELDS.every((value156) =>
      new RegExp(value156 + '\\s*[：:]', 'u').test(text9),
    )
  )
    return text9;
  const run2 = (value157) =>
      normalizeText(
        text9.match(new RegExp(value157 + '(?:为|是|偏|呈|如|习惯|[:：])?([^，,；;。]+)', 'u'))?.[1],
      ),
    text10 = normalizeText(text9.match(/(?:^|[，,；;])(?:约)?(幼年|少年|青年|中年|中老年|老年)/u)?.[1]),
    text11 = normalizeText(
      text9.match(
        /(?:约)?([零〇一二两三四五六七八九十百\d]{1,4}岁|[二三四五六七八九]十(?:出头|上下))/u,
      )?.[1],
    ),
    value158 = /女性|女声/u.test(text9) ? '女' : /男性|男声/u.test(text9) ? '男' : '',
    list55 = text9.split(/[，,；;。]+/u)
      .map(normalizeText)
      .filter(Boolean),
    list56 = text9.split(/[；;]+/u)
      .map(normalizeText)
      .filter(Boolean);
  if (
    list56.length === STORY_ASSET_VOICE_DESCRIPTION_FIELDS.length &&
    (text10 || text11) &&
    value158 &&
    /口音/u.test(list56[3]) &&
    /声线/u.test(list56[5]) &&
    /语速/u.test(list56[6]) &&
    /说话/u.test(list56[7]) &&
    /音色/u.test(list56[8])
  ) {
    const run3 = (value159, value160) =>
        normalizeText(
          value159.replace(new RegExp('^' + value160 + '\\s*(?:约|为|是|偏|呈|[:：])?\\s*', 'u'), ''),
        ),
      value161 = {
        年龄: normalizeStringArray([text10, text11]).join('，'),
        性别: value158,
        身份: run3(list56[2], '身份'),
        口音: run3(list56[3], '口音'),
        情绪底色: run3(list56[4], '情绪底色'),
        声线: run3(list56[5], '声线'),
        语速: run3(list56[6], '语速'),
        说话方式: run3(list56[7], '说话方式'),
        音色特征: run3(list56[8], '音色(?:特征)?'),
      };
    if (STORY_ASSET_VOICE_DESCRIPTION_FIELDS.every((value162) => value161[value162]))
      return STORY_ASSET_VOICE_DESCRIPTION_FIELDS.map((value163) => value163 + '：' + value161[value163]).join('；');
  }
  const value164 = list55.find(
      (value165, count3) =>
        count3 > 0 &&
        !/(?:幼年|少年|青年|中年|中老年|老年|男性|女性|男声|女声)/u.test(value165) &&
        !/(?:[零〇一二两三四五六七八九十百\d]{1,4}岁|[二三四五六七八九]十(?:出头|上下))/u.test(value165) &&
        !/^(?:身份|口音|情绪底色|声线|语速|说话方式|音色)/u.test(value165),
    ),
    enabled5 = {
      年龄: normalizeStringArray([text10, text11]).join('，'),
      性别: value158,
      身份: run2('身份') || value164,
      口音: run2('口音'),
      情绪底色: run2('情绪底色'),
      声线: run2('声线'),
      语速: run2('语速'),
      说话方式: run2('说话方式'),
      音色特征: run2('音色(?:特征)?'),
    };
  if (STORY_ASSET_VOICE_DESCRIPTION_FIELDS.some((value166) => !enabled5[value166])) return text9;
  return STORY_ASSET_VOICE_DESCRIPTION_FIELDS.map((value167) => value167 + '：' + enabled5[value167]).join('；');
}
function parseStoryAssetDetailBatchResult(
  value168,
  { assetPlans: assetPlans = [], chapterIds: chapterIds = [], visualStyle: visualStyle = '' } = {},
) {
  const strictJson3 = parseStrictJson(getResultText(value168), 'Agent 未返回资产细化结果。'),
    list57 = Array.isArray(strictJson3?.assets) ? strictJson3.assets : [],
    map23 = new Map(list57.map((value169) => [normalizeReference(value169?.ref), value169]));
  if (list57.length !== assetPlans.length || map23.size !== assetPlans.length)
    throw new Error('资产细化结果必须与当前批次资产数量完全一致。');
  const assets4 = assetPlans.map((ref7) => {
      const args21 = map23.get(ref7.ref);
      if (!args21) throw new Error('资产细化结果缺少“' + ref7.ref + '”。');
      const list58 = Array.isArray(args21?.appearances) ? args21.appearances : [],
        map24 = new Map(list58.map((value170) => [normalizeReference(value170?.ref), value170]));
      if (
        list58.length !== ref7.appearances.length ||
        map24.size !== ref7.appearances.length
      )
        throw new Error('资产“' + ref7.name + '”的形象数量与轻量清单不一致。');
      return {
        ...args21,
        ref: ref7.ref,
        kind: ref7.kind,
        name: ref7.name,
        role: ref7.role,
        voiceDescription:
          ref7.kind === 'character'
            ? normalizeStoryAssetNaturalVoiceDescription(args21?.voiceDescription)
            : '',
        description: formatStoryAssetFactAndDesignDescription(args21, ref7.description),
        occurrences: normalizeText(args21?.occurrences) || ref7.occurrences,
        sourceChapterIds: ref7.sourceEpisodeRefs,
        appearances: ref7.appearances.map((ref8) => {
          const error15 = map24.get(ref8.ref);
          if (!error15) throw new Error('资产“' + ref7.name + '”缺少形象“' + ref8.ref + '”。');
          const prompt = normalizeText(error15?.prompt);
          return {
            ...error15,
            ref: ref8.ref,
            name: normalizeText(error15?.name) || ref8.name,
            description: formatStoryAssetFactAndDesignDescription(error15, ref8.description),
            occurrences: normalizeText(error15?.occurrences) || ref8.occurrences,
            prompt: prompt,
            sourceChapterIds: ref8.sourceEpisodeRefs,
          };
        }),
      };
    }),
    storyAssetExtractionResult = parseStoryAssetExtractionResult(
      { assets: assets4 },
      { chapterIds: chapterIds },
    );
  return storyAssetExtractionResult.assets.map((args22, value171) => {
    const sourceEpisodeRefs3 = assetPlans[value171],
      value172 = map23.get(sourceEpisodeRefs3.ref) || {},
      map25 = new Map(
        (Array.isArray(value172?.appearances) ? value172.appearances : []).map((value173) => [
          normalizeReference(value173?.ref),
          value173,
        ]),
      ),
      prompt2 = args22.appearances.map((args23, value174) => {
        const sourceEpisodeRefs4 = sourceEpisodeRefs3.appearances[value174],
          value175 = map25.get(sourceEpisodeRefs4.ref) || {};
        return {
          ...args23,
          scriptFacts: normalizeText(value175?.scriptFacts),
          visualDesign: normalizeText(value175?.visualDesign),
          designStatus: 'ai-facts-plus-visual-completion',
          prompt: ensureStoryAssetVisualStyle(args23.prompt, visualStyle),
          sourceEpisodeRefs: sourceEpisodeRefs4.sourceEpisodeRefs,
          sourceSceneRefs: sourceEpisodeRefs4.sourceSceneRefs,
        };
      });
    return {
      ...args22,
      scriptFacts: normalizeText(value172?.scriptFacts),
      visualDesign: normalizeText(value172?.visualDesign),
      designStatus: 'ai-facts-plus-visual-completion',
      prompt: prompt2[0]?.prompt || normalizeText(args22?.prompt),
      sourceEpisodeRefs: sourceEpisodeRefs3.sourceEpisodeRefs,
      sourceSceneRefs: sourceEpisodeRefs3.sourceSceneRefs,
      appearances: prompt2,
    };
  });
}
function formatStoryAssetFactAndDesignDescription(options5 = {}, value176 = '') {
  const stripStoryAssetInternalEvidenceMetadata2 = stripStoryAssetInternalEvidenceMetadata(
      options5?.scriptFacts,
    ),
    stripStoryAssetInternalEvidenceMetadata3 = stripStoryAssetInternalEvidenceMetadata(
      options5?.visualDesign,
    ),
    list59 = [
      stripStoryAssetInternalEvidenceMetadata2 ? '剧本事实：' + stripStoryAssetInternalEvidenceMetadata2 : '',
      stripStoryAssetInternalEvidenceMetadata3 ? '视觉补全：' + stripStoryAssetInternalEvidenceMetadata3 : '',
    ].filter(Boolean);
  return (
    list59.join('\n') ||
    stripStoryAssetInternalEvidenceMetadata(options5?.description) ||
    stripStoryAssetInternalEvidenceMetadata(value176)
  );
}
function createCoverageError(issues) {
  const value177 = issues.slice(0, 3)
      .map(
        (value178) =>
          value178.type +
          ':' +
          value178.sourceSceneRef +
          (value178.expectedName ? ':' + value178.expectedName : ''),
      )
      .join('；'),
    error16 = new Error('实验资产清单覆盖校验未通过：' + value177 + '。');
  return ((error16.validationDetails = { issues: issues }), error16);
}
const STORY_ASSET_EXTRACTION_DRAFT_STRATEGY = 'kind-compact-v7',
  STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY = 'evidence-batched-api-v2';
function createStoryAssetStructuredOutput(name4, schema) {
  return { name: name4, schema: schema, strict: true, fallback: 'none' };
}
function createStoryAssetKindStructuredOutput(value179) {
  const storyAssetKind = normalizeStoryAssetKind(value179),
    properties = { name: { type: 'string' } },
    required = ['name'];
  return (
    storyAssetKind === 'character' &&
      ((properties.role = { type: 'string', enum: ['主角', '配角', '反派', '路人'] }),
      required.push('role')),
    storyAssetKind === 'scene' &&
      ((properties.sourceSceneRefs = { type: 'array', minItems: 2, items: { type: 'string' } }),
      required.push('sourceSceneRefs')),
    createStoryAssetStructuredOutput('story_asset_' + storyAssetKind + '_compact_v7', {
      type: 'object',
      additionalProperties: false,
      required: ['assets'],
      properties: {
        assets: {
          type: 'array',
          items: { type: 'object', additionalProperties: false, required: required, properties: properties },
        },
      },
    })
  );
}
function createStoryAssetInventoryStructuredOutput() {
  const items = {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'sourceSceneRefs'],
    properties: { name: { type: 'string' }, sourceSceneRefs: { type: 'array', items: { type: 'string' } } },
  };
  return createStoryAssetStructuredOutput('story_asset_inventory_v5', {
    type: 'object',
    additionalProperties: false,
    required: ['assets', 'sceneAudits'],
    properties: {
      assets: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['kind', 'name', 'role', 'sourceSceneRefs', 'appearances'],
          properties: {
            kind: { type: 'string', enum: STORY_ASSET_EXPERIMENTAL_KINDS },
            name: { type: 'string' },
            role: { type: 'string' },
            sourceSceneRefs: { type: 'array', items: { type: 'string' } },
            appearances: { type: 'array', items: items },
          },
        },
      },
      sceneAudits: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['sourceSceneRef', 'characterNames', 'keyPropNames'],
          properties: {
            sourceSceneRef: { type: 'string' },
            characterNames: { type: 'array', items: { type: 'string' } },
            keyPropNames: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  });
}
function createStoryAssetInventoryRepairStructuredOutput() {
  return createStoryAssetStructuredOutput('story_asset_inventory_repair_v5', {
    type: 'object',
    additionalProperties: false,
    required: ['upserts', 'removeAssetRefs'],
    properties: {
      upserts: createStoryAssetInventoryStructuredOutput().schema.properties.assets,
      removeAssetRefs: { type: 'array', items: { type: 'string' } },
    },
  });
}
function createStoryAssetDetailStructuredOutput(value180 = 0, value181 = []) {
  const list60 = Array.isArray(value181) ? value181 : [],
    minItems = normalizeStringArray(list60.map((value182) => value182?.ref)),
    ref9 = normalizeStringArray(
      list60.flatMap((value183) =>
        Array.isArray(value183?.appearances)
          ? value183.appearances.map((value184) => value184?.ref)
          : [],
      ),
    );
  return createStoryAssetStructuredOutput('story_asset_detail_v5_' + (value180 + 1), {
    type: 'object',
    additionalProperties: false,
    required: ['assets'],
    properties: {
      assets: {
        type: 'array',
        ...(minItems.length ? { minItems: minItems.length, maxItems: minItems.length } : {}),
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['ref', 'scriptFacts', 'visualDesign', 'voiceDescription', 'appearances'],
          properties: {
            ref: minItems.length ? { type: 'string', enum: minItems } : { type: 'string' },
            scriptFacts: { type: 'string' },
            visualDesign: { type: 'string' },
            voiceDescription: { type: 'string' },
            appearances: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['ref', 'scriptFacts', 'visualDesign', 'prompt'],
                properties: {
                  ref: ref9.length ? { type: 'string', enum: ref9 } : { type: 'string' },
                  scriptFacts: { type: 'string' },
                  visualDesign: { type: 'string' },
                  prompt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  });
}
function extractBalancedStoryAssetObjects(value185, value186 = 'assets') {
  const list61 = normalizeText(getResultText(value185)),
    count4 = list61.search(new RegExp('(?:"' + value186 + '"|\'' + value186 + "')\\s*:", 'u'));
  if (count4 < 0) return [];
  const count5 = list61.indexOf('[', count4);
  if (count5 < 0) return [];
  const list62 = [];
  let count6 = -1,
    count7 = 0,
    value187 = false,
    value188 = false;
  for (let value189 = count5 + 1; value189 < list61.length; value189 += 1) {
    const value190 = list61[value189];
    if (value187) {
      if (value188) value188 = false;
      else {
        if (value190 === '\\') value188 = true;
        else {
          if (value190 === '"') value187 = false;
        }
      }
      continue;
    }
    if (value190 === '"') {
      value187 = true;
      continue;
    }
    if (value190 === '{') {
      if (count7 === 0) count6 = value189;
      count7 += 1;
      continue;
    }
    if (value190 === '}' && count7 > 0) {
      count7 -= 1;
      if (count7 === 0 && count6 >= 0) {
        try {
          list62.push(JSON.parse(list61.slice(count6, value189 + 1)));
        } catch {}
        count6 = -1;
      }
    }
    if (value190 === ']' && count7 === 0) break;
  }
  return list62;
}
function salvageStoryAssetInventoryResult(value191, { sourceScenes: sourceScenes = [] } = {}) {
  const list63 = extractBalancedStoryAssetObjects(value191, 'assets'),
    assets5 = list63.flatMap((value192) => {
      try {
        return normalizeInventoryAssets([value192], { sourceScenes: sourceScenes, allowEmpty: true });
      } catch {
        return [];
      }
    });
  if (!assets5.length) return null;
  const value193 = new Set();
  return (
    assets5.forEach((value194, value195) => {
      value194.ref = createUniqueStoryAssetInventoryRef(
        value194.ref,
        value193,
        'asset-' + (value195 + 1),
      );
    }),
    {
      schemaVersion: STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION,
      assets: assets5,
      sceneAudits: sourceScenes.map((sourceSceneRef6) => ({
        sourceSceneRef: sourceSceneRef6.ref,
        characterNames: normalizeStringArray(
          assets5.filter(
            (value196) =>
              value196.kind === 'character' &&
              value196.sourceSceneRefs.includes(sourceSceneRef6.ref),
          ).map((error17) => error17.name),
        ),
        keyPropNames: normalizeStringArray(
          assets5.filter(
            (value197) =>
              value197.kind === 'prop' && value197.sourceSceneRefs.includes(sourceSceneRef6.ref),
          ).map((error18) => error18.name),
        ),
      })),
      salvaged: true,
    }
  );
}
function parseStoryAssetInventoryResultWithSalvage(value198, value199 = {}) {
  try {
    return parseStoryAssetInventoryResult(value198, value199);
  } catch (value200) {
    const salvageStoryAssetInventoryResult2 = salvageStoryAssetInventoryResult(value198, value199);
    if (salvageStoryAssetInventoryResult2) return salvageStoryAssetInventoryResult2;
    throw value200;
  }
}
function salvageStoryAssetDetailBatchResult(
  value201,
  { assetPlans: assetPlans = [], chapterIds: chapterIds = [], visualStyle: visualStyle = '' } = {},
) {
  const map26 = new Map(
      extractBalancedStoryAssetObjects(value201, 'assets').map((value202) => [
        normalizeReference(value202?.ref),
        value202,
      ]),
    ),
    list64 = [];
  return (
    assetPlans.forEach((value203) => {
      const enabled6 = map26.get(value203.ref);
      if (!enabled6) return;
      try {
        list64.push(
          ...parseStoryAssetDetailBatchResult(
            { assets: [enabled6] },
            { assetPlans: [value203], chapterIds: chapterIds, visualStyle: visualStyle },
          ),
        );
      } catch {}
    }),
    list64
  );
}
export function splitDeterministicStorySceneAssetNames(value204 = '') {
  const value205 = /(?:客厅|厨房|走廊|卧室|书房|餐厅|浴室|卫生间|阳台|玄关)$/u,
    list65 = normalizeText(value204)
      .split(/[/／|｜]+/u)
      .map((value206) => normalizeStorySceneHeadingIdentity(value206))
      .filter(Boolean),
    value207 = list65[0] || '',
    value208 = value207.replace(value205, ''),
    list66 = [];
  return (
    list65.map((args24, count8) =>
      count8 > 0 && value208 && [...args24].length <= 4 && value205.test(args24)
        ? '' + value208 + args24
        : args24,
    ).forEach((value209) => {
      const storySceneIdentityKey = getStorySceneIdentityKey(value209);
      storySceneIdentityKey &&
        !list66.some((value210) => getStorySceneIdentityKey(value210) === storySceneIdentityKey) &&
        list66.push(value209);
    }),
    list66
  );
}
function createDeterministicStoryAssetInventory({
  project: project = {},
  sourceScenes: sourceScenes = [],
} = {}) {
  const list67 = (Array.isArray(project?.characters) ? project.characters : []).filter(
      (error19) => normalizeText(error19?.name),
    ),
    map27 = new Map();
  sourceScenes.forEach((value211) => {
    splitDeterministicStorySceneAssetNames(value211.assetHeading || value211.heading).forEach(
      (name5) => {
        const storySceneIdentityKey2 = getStorySceneIdentityKey(name5),
          value212 = map27.get(storySceneIdentityKey2) || { name: name5, sourceSceneRefs: [] };
        (value212.sourceSceneRefs.push(value211.ref),
          map27.set(storySceneIdentityKey2, value212));
      },
    );
  });
  const assets6 = [];
  list67.forEach((error20, value213) => {
    const name6 = normalizeText(error20.name),
      list68 = getStoryAssetNameAliases(name6),
      list69 = sourceScenes.filter(
        (dom2) =>
          dom2.characters.some((value214) => storyCharacterNamesOverlap(name6, value214)) ||
          list68.some((value215) => dom2.body.includes(value215)),
      ).map((value216) => value216.ref);
    if (!list69.length) return;
    const ref10 = 'local-character-' + (value213 + 1);
    assets6.push({
      ref: ref10,
      kind: 'character',
      name: name6,
      role: resolveStoryCharacterRole(error20?.roleType || error20?.role),
      description: normalizeText(error20?.profile || error20?.fixedTraits),
      sourceSceneRefs: normalizeStringArray(list69),
      appearances: [
        {
          ref: ref10 + '-base',
          name: '基础形象',
          description: normalizeText(error20?.fixedTraits),
          sourceSceneRefs: normalizeStringArray(list69),
        },
      ],
    });
  });
  const map28 = createDeterministicStoryCharacterCandidateMap(sourceScenes);
  return (
    [...map28.entries()].forEach(([name7, value217], value218) => {
      const ref11 = 'local-source-character-' + (value218 + 1),
        sourceSceneRefs4 = normalizeStringArray(value217.sourceSceneRefs);
      assets6.push({
        ref: ref11,
        kind: 'character',
        name: name7,
        role: '配角',
        description: '',
        sourceSceneRefs: sourceSceneRefs4,
        appearances: [
          { ref: ref11 + '-base', name: '基础形象', description: '', sourceSceneRefs: sourceSceneRefs4 },
        ],
      });
    }),
    [...map27.values()].forEach((name8, value219) => {
      const ref12 = 'local-scene-' + (value219 + 1);
      assets6.push({
        ref: ref12,
        kind: 'scene',
        name: name8.name,
        role: '剧情场景',
        description: '',
        sourceSceneRefs: normalizeStringArray(name8.sourceSceneRefs),
        appearances: [
          {
            ref: ref12 + '-base',
            name: '基础形象',
            description: '',
            sourceSceneRefs: normalizeStringArray(name8.sourceSceneRefs),
          },
        ],
      });
    }),
    createStoryAssetActionPropCandidates(sourceScenes).forEach((name9, value220) => {
      const ref13 = 'local-action-prop-' + (value220 + 1);
      assets6.push({
        ref: ref13,
        kind: 'prop',
        name: name9.name,
        role: '关键道具',
        description: '',
        sourceSceneRefs: normalizeStringArray(name9.sourceSceneRefs),
        appearances: [
          {
            ref: ref13 + '-base',
            name: '基础形象',
            description: '',
            sourceSceneRefs: normalizeStringArray(name9.sourceSceneRefs),
          },
        ],
      });
    }),
    parseStoryAssetInventoryResult(
      {
        assets: assets6,
        sceneAudits: sourceScenes.map((sourceSceneRef7) => ({
          sourceSceneRef: sourceSceneRef7.ref,
          characterNames: [],
          keyPropNames: [],
        })),
      },
      { sourceScenes: sourceScenes },
    )
  );
}
function getStorySceneAssignmentScore(error21, value221, assetIndex) {
  const storySceneIdentityKey3 = getStorySceneIdentityKey(error21?.name),
    storySceneIdentityKey4 = getStorySceneIdentityKey(value221?.assetHeading || value221?.heading),
    list70 = normalizeStringArray([
      ...(value221?.localEntityCandidates?.scene || []),
      ...(value221?.localEntityEvidence || [])
        .filter((value222) => value222?.kind === 'scene')
        .map((response3) => response3?.text),
    ]);
  let score = 0;
  if (storySceneIdentityKey3 && storySceneIdentityKey3 === storySceneIdentityKey4) score += 10000;
  if (list70.some((value223) => getStorySceneIdentityKey(value223) === storySceneIdentityKey3))
    score += 1000;
  if (
    storySceneIdentityKey3 &&
    storySceneIdentityKey4 &&
    storySceneIdentitiesOverlap(storySceneIdentityKey3, storySceneIdentityKey4)
  )
    score += 100;
  return (
    (score -= Math.max(0, normalizeStringArray(error21?.sourceSceneRefs).length - 1)),
    { score: score, assetIndex: assetIndex }
  );
}
function getReusableStorySceneIdentityKey(value224) {
  return normalizeStorySceneHeadingIdentity(value224)
    .replace(/[（(](?:稍后|封锁|断电|电力|后半夜|窗边|紧接|紧随|细雨|雨天)[^）)]*[）)]\s*$/u, '')
    .replace(/宴会大厅/gu, '宴会厅')
    .replace(/集团(?:总部|大楼|大厦)/gu, '集团')
    .replace(/市区上空/gu, '市上空')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}
function reconcileStorySceneAssetAssignments(list71 = [], list72 = [], list73 = []) {
  const list74 = list71.filter((value225) => value225?.kind === 'scene'),
    map29 = new Map();
  return (
    list73.forEach((value226) => {
      const list75 = list74.map((asset, assetIndex2) => ({
        asset: asset,
        assetIndex: assetIndex2,
      }))
        .filter(({ asset: asset2 }) =>
          normalizeStringArray(asset2?.sourceSceneRefs).includes(value226.ref),
        )
        .map(({ asset: asset3, assetIndex: assetIndex3 }) => ({
          asset: asset3,
          ...getStorySceneAssignmentScore(asset3, value226, assetIndex3),
        }))
        .sort(
          (value227, value228) =>
            value228.score - value227.score || value227.assetIndex - value228.assetIndex,
        );
      if (!list75.length) return;
      const value229 = /[/／|｜]/u.test(
          normalizeText(value226?.assetHeading || value226?.heading),
        ),
        list76 = value229
          ? list75.map((value230) => value230.asset).filter(
              (error22) => !/[/／|｜]/u.test(normalizeText(error22?.name)),
            )
          : [list75[0].asset];
      if (list76.length) map29.set(value226.ref, new Set(list76));
    }),
    list73.forEach((value231) => {
      if (map29.has(value231.ref)) return;
      const list77 = list72.filter(
        (value232) =>
          value232?.kind === 'scene' &&
          normalizeStringArray(value232?.sourceSceneRefs).includes(value231.ref),
      );
      if (!list77.length) return;
      const value233 = /[/／|｜]/u.test(
          normalizeText(value231?.assetHeading || value231?.heading),
        ),
        list78 = value233
          ? list77.filter((error23) => !/[/／|｜]/u.test(normalizeText(error23?.name)))
          : list77.slice(0, 1),
        value234 = new Set();
      list78.forEach((appearances3) => {
        let enabled7 = list74.find(
          (error24) =>
            normalizeText(error24?.name).toLowerCase() ===
            normalizeText(appearances3.name).toLowerCase(),
        );
        (!enabled7 &&
          ((enabled7 = {
            ...appearances3,
            sourceSceneRefs: [],
            appearances: appearances3.appearances
              .slice(0, 1)
              .map((args25) => ({ ...args25, sourceSceneRefs: [] })),
          }),
          list71.push(enabled7),
          list74.push(enabled7)),
          value234.add(enabled7));
      });
      if (value234.size) map29.set(value231.ref, value234);
    }),
    list74.forEach((ref14) => {
      const value235 = list73.filter((value236) => map29.get(value236.ref)?.has(ref14)).map(
        (value237) => value237.ref,
      );
      ref14.sourceSceneRefs = normalizeStringArray(value235);
      const value238 = ref14.appearances[0] || {
        ref: ref14.ref + '-base',
        name: '基础形象',
        description: '',
        sourceSceneRefs: [],
      };
      ((ref14.appearances = (ref14.appearances.length ? ref14.appearances : [value238]).map(
        (args26) => ({
          ...args26,
          sourceSceneRefs: normalizeStringArray(args26?.sourceSceneRefs).filter((value239) =>
            ref14.sourceSceneRefs.includes(value239),
          ),
        }),
      )),
        ref14.sourceSceneRefs.forEach((value240) => {
          if (ref14.appearances.some((value241) => value241.sourceSceneRefs.includes(value240)))
            return;
          ref14.appearances[0].sourceSceneRefs.push(value240);
        }));
    }),
    list71
  );
}
export function reconcileStoryAssetInventory(
  sceneAudits2 = {},
  { project: project = {}, sourceScenes: sourceScenes = [] } = {},
) {
  const assets7 = createDeterministicStoryAssetInventory({ project: project, sourceScenes: sourceScenes }),
    map30 = createDeterministicStoryCharacterCandidateMap(sourceScenes),
    storyAssetLocalCharacterCanonicalNames = getStoryAssetLocalCharacterCanonicalNames(sourceScenes),
    stringArray = normalizeStringArray(
      (Array.isArray(project?.characters) ? project.characters : []).map(
        (error25) => error25?.name,
      ),
    );
  assets7.assets = mergeStoryAssetInventoryResults(
    [
      {
        assets: assets7.assets.map((error26) =>
          error26?.kind === 'character'
            ? {
                ...error26,
                name:
                  resolveStoryProjectCharacterCanonicalName(error26.name, stringArray) ||
                  resolveStoryAssetCharacterCanonicalName(
                    error26.name,
                    map30,
                    storyAssetLocalCharacterCanonicalNames,
                  ),
              }
            : error26,
        ),
        sceneAudits: [],
      },
    ],
    { sourceScenes: sourceScenes },
  ).assets;
  const map31 = new Set(
      assets7.assets
        .filter((value242) => normalizeText(value242?.ref).startsWith('local-source-character-'))
        .map((error27) => normalizeText(error27?.name).toLowerCase()),
    ),
    map32 = new Set(
      assets7.assets
        .filter((value243) => normalizeText(value243?.ref).startsWith('local-action-prop-'))
        .map((error28) => normalizeText(error28?.name).toLowerCase()),
    ),
    assets8 = (cloneStoryAssetExtractionValue(sceneAudits2?.assets) || [])
      .filter((error29) => {
        const text12 = normalizeText(error29?.ref),
          text13 = normalizeText(error29?.name).toLowerCase();
        if (text12.startsWith('local-source-character-')) return map31.has(text13);
        if (text12.startsWith('local-action-prop-')) return map32.has(text13);
        return true;
      })
      .flatMap((appearances4) => {
        if (appearances4?.kind === 'scene') {
          const reusableStorySceneIdentityKey = getReusableStorySceneIdentityKey(appearances4?.name),
            list79 = normalizeStringArray(appearances4?.sourceSceneRefs),
            handler3 = (value244) =>
              reusableStorySceneIdentityKey &&
              reusableStorySceneIdentityKey ===
                getReusableStorySceneIdentityKey(value244?.assetHeading || value244?.heading),
            enabled8 =
              sourceScenes.find((value245) => list79.includes(value245.ref) && handler3(value245)) ||
              sourceScenes.find(handler3);
          if (!enabled8) return [appearances4];
          const map33 = new Set(sourceScenes.filter(handler3).map((value246) => value246.ref)),
            sourceSceneRefs5 = list79.filter((value247) => map33.has(value247));
          return [
            {
              ...appearances4,
              name: normalizeText(enabled8.assetHeading || enabled8.heading),
              sourceSceneRefs: sourceSceneRefs5,
              appearances: appearances4.appearances.map((args27) => ({
                ...args27,
                sourceSceneRefs: normalizeStringArray(args27?.sourceSceneRefs).filter((value248) =>
                  map33.has(value248),
                ),
              })),
            },
          ];
        }
        if (appearances4?.kind !== 'character') return [appearances4];
        const deterministicStoryCharacterCandidate2 = normalizeDeterministicStoryCharacterCandidate(
          appearances4?.name,
        );
        if (!deterministicStoryCharacterCandidate2) return [];
        const name10 =
          resolveStoryProjectCharacterCanonicalName(deterministicStoryCharacterCandidate2, stringArray) ||
          resolveStoryAssetCharacterCanonicalName(
            deterministicStoryCharacterCandidate2,
            map30,
            storyAssetLocalCharacterCanonicalNames,
          );
        if (!name10) return [];
        const enabled9 = [...map30.keys()].some((value249) =>
          storyCharacterNamesStronglyOverlap(value249, name10),
        );
        if (normalizeText(appearances4?.ref).startsWith('local-source-character-') && !enabled9)
          return [];
        return [{ ...appearances4, name: name10 }];
      }),
    inventoryAssets = mergeStoryAssetInventoryResults([{ assets: assets8, sceneAudits: [] }], {
      sourceScenes: sourceScenes,
    }).assets,
    candidateLedger = createStoryAssetCandidateLedger({
      sourceScenes: sourceScenes,
      authoritativeAssets: assets7.assets,
      inventoryAssets: inventoryAssets,
      sceneAudits: sceneAudits2?.sceneAudits,
    }),
    list80 = [];
  inventoryAssets.forEach((error30) => {
    const response4 = candidateLedger.reviewAsset(error30, { origin: 'inventory-asset' });
    if (response4.status !== 'promoted') return;
    if (error30?.kind !== 'character') {
      list80.push(error30);
      return;
    }
    const text14 = normalizeText(error30?.name);
    if (!text14) return;
    const args28 = list80.find(
      (error31) =>
        error31.kind === 'character' && storyCharacterNamesStronglyOverlap(error31.name, text14),
    );
    if (!args28) {
      list80.push(error30);
      return;
    }
    ((args28.role = resolveMergedStoryCharacterRole(args28.role, error30.role)),
      (args28.description = args28.description || error30.description),
      (args28.sourceSceneRefs = normalizeStringArray([
        ...args28.sourceSceneRefs,
        ...error30.sourceSceneRefs,
      ])),
      error30.appearances.forEach((error32) => {
        const value250 = args28.appearances.find(
          (error33) =>
            normalizeText(error33.name).toLowerCase() ===
            normalizeText(error32.name).toLowerCase(),
        );
        value250
          ? mergeStoryAssetInventoryAppearance(value250, error32)
          : args28.appearances.push(error32);
      }));
  });
  const list81 = new Map(
      (Array.isArray(sceneAudits2?.sceneAudits) ? sceneAudits2.sceneAudits : []).map(
        (args29) => [
          args29.sourceSceneRef,
          {
            ...args29,
            characterNames: normalizeStringArray(
              (args29?.characterNames || [])
                .map(
                  (value251) =>
                    resolveStoryProjectCharacterCanonicalName(value251, stringArray) ||
                    resolveStoryAssetCharacterCanonicalName(
                      value251,
                      map30,
                      storyAssetLocalCharacterCanonicalNames,
                    ),
                )
                .filter((name11) =>
                  ['absorbed', 'promoted'].includes(
                    candidateLedger.reviewAsset(
                      { kind: 'character', name: name11, sourceSceneRefs: [args29?.sourceSceneRef] },
                      { origin: 'inventory-audit' },
                    ).status,
                  ),
                ),
            ),
          },
        ],
      ),
    ),
    handler4 = (value252, value253) =>
      list80.find(
        (error34) =>
          error34.kind === value252 &&
          (value252 === 'character'
            ? storyCharacterNamesStronglyOverlap(error34.name, value253)
            : normalizeText(error34.name).toLowerCase() === normalizeText(value253).toLowerCase()),
      );
  (assets7.assets
    .filter((value254) => value254.kind === 'character')
    .forEach((error35) => {
      const args30 = handler4('character', error35.name);
      if (!args30) {
        list80.push(error35);
        return;
      }
      args30.sourceSceneRefs = normalizeStringArray([
        ...args30.sourceSceneRefs,
        ...error35.sourceSceneRefs,
      ]);
      const args31 = args30.appearances[0] || error35.appearances[0];
      args31.sourceSceneRefs = normalizeStringArray([
        ...args31.sourceSceneRefs,
        ...error35.sourceSceneRefs.filter(
          (value255) =>
            !args30.appearances.some((value256) => value256.sourceSceneRefs.includes(value255)),
        ),
      ]);
      if (!args30.appearances.length) args30.appearances = [args31];
    }),
    assets7.assets
      .filter((value257) => value257.kind === 'prop')
      .forEach((error36) => {
        const args32 = handler4('prop', error36.name);
        if (!args32) {
          list80.push(error36);
          return;
        }
        args32.sourceSceneRefs = normalizeStringArray([
          ...args32.sourceSceneRefs,
          ...error36.sourceSceneRefs,
        ]);
        const args33 = args32.appearances[0] || error36.appearances[0];
        args33.sourceSceneRefs = normalizeStringArray([
          ...args33.sourceSceneRefs,
          ...error36.sourceSceneRefs,
        ]);
        if (!args32.appearances.length) args32.appearances = [args33];
      }));
  const run4 = (kind3, name12, enabled10) => {
    if (!name12 || !enabled10) return;
    const response5 = candidateLedger.reviewAsset(
      { kind: kind3, name: name12, sourceSceneRefs: [enabled10] },
      { origin: 'inventory-audit' },
    );
    if (!['absorbed', 'promoted'].includes(response5.status)) return;
    let args34 = handler4(kind3, name12);
    if (!args34 && response5.status === 'promoted') {
      const ref15 = 'evidence-' + kind3 + '-' + (list80.length + 1);
      ((args34 = {
        ref: ref15,
        kind: kind3,
        name: normalizeText(name12),
        role: kind3 === 'character' ? '配角' : '关键道具',
        description: '',
        sourceSceneRefs: [],
        appearances: [{ ref: ref15 + '-base', name: '基础形象', description: '', sourceSceneRefs: [] }],
      }),
        list80.push(args34));
    }
    if (!args34) return;
    args34.sourceSceneRefs = normalizeStringArray([...args34.sourceSceneRefs, enabled10]);
    const enabled11 = args34.appearances.find((value258) =>
      value258.sourceSceneRefs.includes(enabled10),
    );
    !enabled11 &&
      args34.appearances[0] &&
      (args34.appearances[0].sourceSceneRefs = normalizeStringArray([
        ...args34.appearances[0].sourceSceneRefs,
        enabled10,
      ]));
  };
  (list81.forEach((value259, value260) => {
    (normalizeStringArray(value259?.characterNames).forEach((value261) => {
      run4('character', value261, value260);
    }),
      normalizeStringArray(value259?.keyPropNames).forEach((value262) => {
        run4('prop', value262, value260);
      }));
  }),
    reconcileStorySceneAssetAssignments(list80, assets7.assets, sourceScenes));
  const assets9 = list80.filter((value263) => value263.sourceSceneRefs.length);
  assets9.forEach((value264) => {
    (value264.sourceSceneRefs.forEach((value265) => {
      const list82 = value264.appearances.filter((value266) =>
        value266.sourceSceneRefs.includes(value265),
      );
      if (!list82.length) value264.appearances[0].sourceSceneRefs.push(value265);
      value264.kind !== 'scene' &&
        list82.slice(1).forEach((value267) => {
          value267.sourceSceneRefs = value267.sourceSceneRefs.filter(
            (value268) => value268 !== value265,
          );
        });
    }),
      value264.appearances.forEach((value269) => {
        value269.sourceSceneRefs = normalizeStringArray(value269.sourceSceneRefs);
      }));
  });
  const value270 = new Set(),
    value271 = new Set();
  assets9.forEach((value272, value273) => {
    ((value272.ref = createUniqueStoryAssetInventoryRef(
      value272.ref,
      value270,
      'asset-' + (value273 + 1),
    )),
      value272.appearances.forEach((value274, value275) => {
        value274.ref = createUniqueStoryAssetAppearanceRef(
          value274.ref,
          value271,
          value272.ref + '-appearance-' + (value275 + 1),
        );
      }));
  });
  const map34 = new Set(
      assets9.filter((value276) => value276.kind === 'prop').map((error37) => error37.name),
    ),
    args35 = parseStoryAssetInventoryResult(
      {
        assets: assets9,
        sceneAudits: sourceScenes.map((sourceSceneRef8) => ({
          sourceSceneRef: sourceSceneRef8.ref,
          characterNames: normalizeStringArray(
            assets9.filter(
              (value277) =>
                value277.kind === 'character' &&
                value277.sourceSceneRefs.includes(sourceSceneRef8.ref),
            ).map((error38) => error38.name),
          ),
          keyPropNames: normalizeStringArray([
            ...(list81.get(sourceSceneRef8.ref)?.keyPropNames || []).filter((value278) =>
              map34.has(value278),
            ),
            ...assets9.filter(
              (value279) =>
                value279.kind === 'prop' &&
                value279.sourceSceneRefs.includes(sourceSceneRef8.ref),
            ).map((error39) => error39.name),
          ]),
        })),
      },
      { sourceScenes: sourceScenes },
    );
  return { ...args35, candidateLedger: candidateLedger.snapshot() };
}
const STORY_ASSET_KIND_LABELS = Object.freeze({ character: '角色', scene: '场景', prop: '道具' });
function normalizeStoryAssetKind(value280) {
  const text15 = normalizeText(value280);
  if (!STORY_ASSET_EXPERIMENTAL_KINDS.includes(text15))
    throw new Error('资产提取不支持类型“' + (text15 || '未指定') + '”。');
  return text15;
}
function buildStoryAssetKindSystemPrompt(value281) {
  const storyAssetKind2 = normalizeStoryAssetKind(value281),
    value282 = STORY_ASSET_KIND_LABELS[storyAssetKind2],
    value283 =
      storyAssetKind2 === 'character'
        ? '每项只能包含 name 和 role'
        : storyAssetKind2 === 'scene'
          ? '每项只能包含 name 和 sourceSceneRefs'
          : '每项只能包含 name';
  return [
    '你是专业的影视' + value282 + '资产提取 Agent。',
    storyAssetKind2 === 'scene'
      ? '本次只返回需要合并的重复场景组；只出现一次的唯一场景禁止返回。'
      : '本次只提取全部' + value282 + '，禁止返回其他类型的资产。',
    ...(storyAssetKind2 === 'scene'
      ? ['必须从第一场到最后一场完整扫描全部重复关系，所有重复组都要返回，不得遗漏。']
      : []),
    '输入包含完整分集剧本，只把它作为识别与视觉设定依据，不续写剧情，不生成分镜。',
    '输出必须极短：' + value283 + '。',
    '禁止返回 description、提示词、形象列表、声音、出现范围、章节、解释、Markdown 或契约外字段。',
    '只返回一个 JSON 对象，顶层只能包含 assets 数组。',
  ].join('\n');
}
function buildStoryAssetKindOutputSchema(name13) {
  if (name13 === 'character')
    return { assets: [{ name: '角色姓名或不超过 6 个汉字的身份短称', role: '主角、配角、反派或路人' }] };
  return {
    assets: [
      {
        name: name13 === 'scene' ? '场景名称及必要的视觉状态' : '关键道具名称',
        ...(name13 === 'scene' ? { sourceSceneRefs: ['sourceScenes[].ref'] } : {}),
      },
    ],
  };
}
function buildStoryAssetKindRequirements(value284, value285 = '') {
  const value286 =
      value284 === 'character'
        ? 'name 和 role'
        : value284 === 'scene'
          ? 'name 和 sourceSceneRefs'
          : 'name',
    list83 = [
      '本轮必须阅读全部 sourceScenes，但 assets 中只能返回 assetKind 指定的一种资产。',
      'storyContext.characters[].fixedTraits 与 continuityFacts 是已确认约束，不得为了视觉效果改写。',
      '每项只能返回 ' + value286 + '；其余信息全部由客户端补齐。',
      '不要为了满足数量而虚构资产；确实没有该类资产时返回 {"assets":[]}。',
    ];
  if (value284 === 'character')
    list83.push(
      '提取需要保持人物外观一致的真实角色；动作短语、台词引导语、评论区、记者群等泛称不得当作具名角色。',
      'role 只能是主角、配角、反派或路人。',
      '每项只返回 name 和 role；禁止返回人物描述。',
    );
  else
    value284 === 'scene'
      ? list83.push(
          'assets 只列重复场景合并组；每组必须包含至少两个 sourceScenes[].ref，唯一场景由客户端本地补齐。',
          '先只扫描 sceneHeadingIndex 完成地点聚类，再结合 sourceScenes 正文消歧；必须穷尽全部重复组，不能只合并字面完全相同的标题。',
          '同一物理空间因简称、所属人或机构前缀、日夜、稍后、紧接、后半夜、窗边、天气、镜头位置、封锁或断电等标题变体应合并。',
          '同义空间词和组织简称也视为同一地点，例如宴会厅/宴会大厅、总部/集团大楼/大厦、都市报社/滨海都市报、临时避难室/避难室。',
          '人物住所的泛称与具体房间名在正文确认相同时应合并，例如旧楼/老楼单间/租处；空间状态后缀也不能制造新场景，例如废墟旁广场/广场。',
          '标题写同地点、原地、旁边或仅写状态时，必须结合相邻 sourceScenes 和正文解析其真实地点后归入对应重复组。',
          '不同房间、入口与室内、地面与天台、物理空间与意识/梦境/回忆空间、完好建筑与结构性废墟不得合并。',
          '同一个 sourceScenes[].ref 最多出现在一个重复组中；sourceSceneRefs 只能引用真实 ref。',
          'name 使用去掉时间、转场和镜头位置修饰后的稳定场景名称，并且必须能与组内每个标题的地点身份对应。',
        )
      : list83.push(
          '只提取跨镜头需要保持视觉一致的剧情关键道具，不提取普通背景杂物、一次性食物或无叙事作用的小物件。',
          '每项只返回 name；禁止返回道具描述。',
        );
  return list83;
}
export function buildStoryAssetKindExtractionPrompt({
  project: project = {},
  episodes: episodes = [],
  sourceScenes: sourceScenes = null,
  kind: kind = 'character',
  batchIndex: batchIndex = 0,
  batchCount: batchCount = 1,
  aspectRatio: aspectRatio = '',
  visualStyle: visualStyle = '',
} = {}) {
  const assetKind = normalizeStoryAssetKind(kind),
    title2 = normalizeStoryContext(project),
    previousRef = Array.isArray(sourceScenes)
      ? sourceScenes
      : normalizeStoryAssetExtractionSources(episodes);
  if (!previousRef.length) throw new Error('资产提取缺少可用的场次正文。');
  const sourceScenes6 = previousRef.map((ref16) => ({
      ref: ref16.ref,
      heading: ref16.heading,
      characters: ref16.characters,
      body: ref16.body,
    })),
    sceneHeadingIndex =
      assetKind === 'scene'
        ? previousRef.map((ref17, count9) => ({
            ref: ref17.ref,
            heading: ref17.heading,
            ...(count9 > 0
              ? {
                  previousRef: previousRef[count9 - 1].ref,
                  previousHeading: previousRef[count9 - 1].heading,
                }
              : {}),
          }))
        : undefined;
  return JSON.stringify({
    task: 'extract_story_assets_by_kind',
    schemaVersion: STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION,
    assetKind: assetKind,
    storyContext: {
      title: title2.title,
      summary: title2.summary,
      setting: title2.setting,
      continuityFacts: title2.continuityFacts,
      ...(assetKind === 'character' ? { characters: title2.characters } : {}),
    },
    ...(sceneHeadingIndex ? { sceneHeadingIndex: sceneHeadingIndex } : {}),
    sourceScenes: sourceScenes6,
    requirements: buildStoryAssetKindRequirements(assetKind),
  });
}
function inferStoryAssetSourceSceneRefs(value287, value288, list84 = []) {
  const text16 = normalizeText(value288);
  if (!text16) return [];
  const list85 = text16.split(/[_＿|｜·•]/u)[0].trim(),
    list86 = getStoryAssetNameAliases(text16);
  return list84.filter((dom3) => {
    if (value287 === 'character')
      return (
        dom3.characters.some((value289) => storyCharacterNamesOverlap(value289, text16)) ||
        list86.some((value290) => dom3.body.includes(value290))
      );
    if (value287 === 'scene')
      return (
        dom3.heading.includes(text16) ||
        (list85.length >= 2 && dom3.heading.includes(list85))
      );
    return dom3.body.includes(text16);
  }).map((value291) => value291.ref);
}
function resolveStoryAssetSourceChapterIds({
  sourceSceneRefs: sourceSceneRefs = [],
  sourceEpisodeRefs: sourceEpisodeRefs = [],
  sourceScenes: sourceScenes = [],
  chapterIds: chapterIds = [],
} = {}) {
  const map35 = new Set(normalizeStringArray(chapterIds)),
    map36 = new Map(sourceScenes.map((value292) => [value292.ref, value292])),
    map37 = new Map();
  sourceScenes.forEach((value293) => {
    if (map37.has(value293.episodeRef)) return;
    const value294 = map35.has(value293.episodeRef)
      ? value293.episodeRef
      : normalizeText(chapterIds[Math.max(0, value293.episodeNumber - 1)]);
    if (value294) map37.set(value293.episodeRef, value294);
  });
  const list87 = normalizeStringArray([
    ...sourceEpisodeRefs,
    ...sourceSceneRefs.map((value295) => map36.get(value295)?.episodeRef),
  ]);
  return normalizeStringArray(
    list87.map((value296) => map37.get(value296) || (map35.has(value296) ? value296 : '')),
  );
}
function ensureStoryAssetVisualStyle(value297, value298 = '') {
  const sanitizeStoryAssetPublicPromptText2 = sanitizeStoryAssetPublicPromptText(value297),
    sanitizeStoryAssetPublicPromptText3 = sanitizeStoryAssetPublicPromptText(value298);
  if (
    !sanitizeStoryAssetPublicPromptText3 ||
    sanitizeStoryAssetPublicPromptText2.startsWith(sanitizeStoryAssetPublicPromptText3)
  )
    return sanitizeStoryAssetPublicPromptText2;
  return sanitizeStoryAssetPublicPromptText3 + '\n' + sanitizeStoryAssetPublicPromptText2;
}
function resolveStoryCharacterRole(value299) {
  return normalizeStoryAssetFinalCharacterRole(value299);
}
function getStoryAssetKindRawAssets(value300, value301) {
  const resultText = getResultText(value300);
  if (Array.isArray(resultText)) return resultText;
  const strictJson4 = parseStrictJson(
    resultText,
    'Agent 未返回' + STORY_ASSET_KIND_LABELS[value301] + '提取结果。',
  );
  if (Array.isArray(strictJson4)) return strictJson4;
  const list88 =
      value301 === 'character'
        ? [strictJson4?.characters, strictJson4?.assets]
        : value301 === 'scene'
          ? [strictJson4?.scenes, strictJson4?.assets]
          : [strictJson4?.props, strictJson4?.assets],
    enabled12 = list88.find(Array.isArray);
  if (!enabled12)
    throw new Error('Agent 返回的' + STORY_ASSET_KIND_LABELS[value301] + '结果缺少 assets 数组。');
  return enabled12;
}
function mergeStoryAssetKindResultAssets(list89 = []) {
  const list90 = [],
    map38 = new Map();
  return (
    list89.forEach((error40) => {
      const text17 = normalizeText(error40?.name).toLowerCase();
      if (!text17) return;
      const args36 = map38.get(text17);
      if (!args36) {
        (map38.set(text17, error40), list90.push(error40));
        return;
      }
      ((args36.description ||= error40.description),
        (args36.voiceDescription ||= error40.voiceDescription),
        (args36.occurrences ||= error40.occurrences),
        (args36.sourceEpisodeRefs = normalizeStringArray([
          ...args36.sourceEpisodeRefs,
          ...error40.sourceEpisodeRefs,
        ])),
        (args36.sourceSceneRefs = normalizeStringArray([
          ...args36.sourceSceneRefs,
          ...error40.sourceSceneRefs,
        ])));
      const map39 = new Map(
        args36.appearances.map((error41) => [normalizeText(error41.name).toLowerCase(), error41]),
      );
      (error40.appearances.forEach((error42) => {
        const text18 = normalizeText(error42.name).toLowerCase(),
          args37 = map39.get(text18);
        if (!args37) {
          (args36.appearances.push(error42), map39.set(text18, error42));
          return;
        }
        ((args37.description ||= error42.description),
          (args37.prompt ||= error42.prompt),
          (args37.occurrences ||= error42.occurrences),
          (args37.sourceEpisodeRefs = normalizeStringArray([
            ...args37.sourceEpisodeRefs,
            ...error42.sourceEpisodeRefs,
          ])),
          (args37.sourceSceneRefs = normalizeStringArray([
            ...args37.sourceSceneRefs,
            ...error42.sourceSceneRefs,
          ])),
          (args37.sourceChapterIds = normalizeStringArray([
            ...args37.sourceChapterIds,
            ...error42.sourceChapterIds,
          ])));
      }),
        (args36.sourceChapterIds = normalizeStringArray([
          ...args36.sourceChapterIds,
          ...error40.sourceChapterIds,
        ])));
    }),
    list90
  );
}
function normalizeStorySceneAssetsForCoverage(
  list91 = [],
  { sourceScenes: sourceScenes = [], chapterIds: chapterIds = [], visualStyle: visualStyle = '' } = {},
) {
  if (!sourceScenes.length) return list91;
  const map40 = new Map(sourceScenes.map((value302, value303) => [value302.ref, value303])),
    enabled13 = /^(?:(?:同地点|同一地点|同一处|原地|此处|该处|这里|旁边)(?:\s|$|[（(])|.+(?:旁|附近|周围)$)/u,
    handler5 = (value304, value305) => {
      const reusableStorySceneIdentityKey2 = getReusableStorySceneIdentityKey(value304),
        reusableStorySceneIdentityKey3 = getReusableStorySceneIdentityKey(value305);
      return Boolean(
        reusableStorySceneIdentityKey2 && reusableStorySceneIdentityKey2 === reusableStorySceneIdentityKey3,
      );
    },
    handler6 = (error43, value306) => {
      if (storySceneIdentitiesOverlap(error43?.name, value306?.heading)) return true;
      const storySceneHeadingIdentity = normalizeStorySceneHeadingIdentity(value306?.heading);
      if (!enabled13.test(storySceneHeadingIdentity)) return false;
      const count10 = map40.get(value306.ref),
        value307 = count10 > 0 ? sourceScenes[count10 - 1]?.ref : '';
      return Boolean(value307 && normalizeStringArray(error43?.sourceSceneRefs).includes(value307));
    },
    map41 = new Map(),
    list92 = [];
  sourceScenes.forEach((value308) => {
    const value309 = list91.map((asset4, assetIndex4) => ({
        asset: asset4,
        assetIndex: assetIndex4,
        explicitlyBound: normalizeStringArray(asset4?.sourceSceneRefs).includes(value308.ref),
        hasExplicitBindings: normalizeStringArray(asset4?.sourceSceneRefs).length > 0,
      }))
        .filter(
          ({ asset: asset5, explicitlyBound: explicitlyBound, hasExplicitBindings: hasExplicitBindings }) =>
            (!hasExplicitBindings || explicitlyBound) &&
            (explicitlyBound
              ? handler6(asset5, value308)
              : storySceneIdentitiesOverlap(asset5?.name, value308?.heading)),
        )
        .sort(
          (value310, value311) =>
            Number(value311.explicitlyBound) - Number(value310.explicitlyBound) ||
            normalizeStringArray(value310.asset?.sourceSceneRefs).length -
              normalizeStringArray(value311.asset?.sourceSceneRefs).length,
        ),
      enabled14 = value309[0];
    if (!enabled14) {
      list92.push(value308);
      return;
    }
    const list93 = map41.get(enabled14.assetIndex) || [];
    (list93.push(value308), map41.set(enabled14.assetIndex, list93));
  });
  const list94 = [...map41.entries()].map(([value312, list95]) => {
    const args38 = list91[value312],
      sourceSceneRefs6 = list95.map((value313) => value313.ref),
      sourceEpisodeRefs5 = deriveSourceEpisodeRefs(
        sourceSceneRefs6,
        new Map(sourceScenes.map((value314) => [value314.ref, value314])),
      ),
      sourceChapterIds = resolveStoryAssetSourceChapterIds({
        sourceSceneRefs: sourceSceneRefs6,
        sourceEpisodeRefs: sourceEpisodeRefs5,
        sourceScenes: sourceScenes,
        chapterIds: chapterIds,
      }),
      appearances5 = (Array.isArray(args38?.appearances) ? args38.appearances : []).map(
        (args39) => ({
          ...args39,
          occurrences: buildOccurrences(sourceEpisodeRefs5),
          sourceChapterIds: sourceChapterIds,
          sourceEpisodeRefs: sourceEpisodeRefs5,
          sourceSceneRefs: sourceSceneRefs6,
        }),
      );
    return {
      ...args38,
      occurrences: buildOccurrences(sourceEpisodeRefs5),
      sourceChapterIds: sourceChapterIds,
      sourceEpisodeRefs: sourceEpisodeRefs5,
      sourceSceneRefs: sourceSceneRefs6,
      appearances: appearances5,
    };
  });
  return (
    list92.forEach((dom4, value315) => {
      const sourceSceneRefs7 = list94.find((error44) => handler5(error44?.name, dom4?.heading));
      if (sourceSceneRefs7) {
        ((sourceSceneRefs7.sourceSceneRefs = normalizeStringArray([
          ...sourceSceneRefs7.sourceSceneRefs,
          dom4.ref,
        ])),
          (sourceSceneRefs7.sourceEpisodeRefs = deriveSourceEpisodeRefs(
            sourceSceneRefs7.sourceSceneRefs,
            new Map(sourceScenes.map((value316) => [value316.ref, value316])),
          )),
          (sourceSceneRefs7.sourceChapterIds = resolveStoryAssetSourceChapterIds({
            sourceSceneRefs: sourceSceneRefs7.sourceSceneRefs,
            sourceEpisodeRefs: sourceSceneRefs7.sourceEpisodeRefs,
            sourceScenes: sourceScenes,
            chapterIds: chapterIds,
          })),
          (sourceSceneRefs7.occurrences = buildOccurrences(sourceSceneRefs7.sourceEpisodeRefs)));
        const value317 = sourceSceneRefs7.appearances[0];
        value317 &&
          ((value317.sourceSceneRefs = [...sourceSceneRefs7.sourceSceneRefs]),
          (value317.sourceEpisodeRefs = [...sourceSceneRefs7.sourceEpisodeRefs]),
          (value317.sourceChapterIds = [...sourceSceneRefs7.sourceChapterIds]),
          (value317.occurrences = sourceSceneRefs7.occurrences));
        return;
      }
      const name14 = normalizeStorySceneHeadingIdentity(dom4?.heading) || '场景 ' + (value315 + 1),
        sourceSceneRefs8 = [dom4.ref],
        sourceEpisodeRefs6 = deriveSourceEpisodeRefs(
          sourceSceneRefs8,
          new Map(sourceScenes.map((value318) => [value318.ref, value318])),
        ),
        sourceChapterIds2 = resolveStoryAssetSourceChapterIds({
          sourceSceneRefs: sourceSceneRefs8,
          sourceEpisodeRefs: sourceEpisodeRefs6,
          sourceScenes: sourceScenes,
          chapterIds: chapterIds,
        }),
        description2 = [
          normalizeText(dom4?.heading),
          stripStoryAssetInternalEvidenceMetadata(dom4?.body).slice(0, 180),
        ]
          .filter(Boolean)
          .join('；'),
        ref18 = normalizeReference('', 'scene-coverage-' + (list94.length + value315 + 1)),
        prompt3 = ensureStoryAssetVisualStyle(
          name14 + '，' + (description2 || '依据原文建立的剧情空间') + '，影视场景设定图，默认无人',
          visualStyle,
        );
      list94.push({
        ref: ref18,
        kind: 'scene',
        name: name14,
        role: '剧情场景',
        description: description2,
        voiceDescription: '',
        occurrences: buildOccurrences(sourceEpisodeRefs6),
        sourceChapterIds: sourceChapterIds2,
        sourceEpisodeRefs: sourceEpisodeRefs6,
        sourceSceneRefs: sourceSceneRefs8,
        appearances: [
          {
            ref: ref18 + '-appearance-1',
            name: '基础形象',
            description: description2,
            occurrences: buildOccurrences(sourceEpisodeRefs6),
            sourceChapterIds: sourceChapterIds2,
            sourceEpisodeRefs: sourceEpisodeRefs6,
            sourceSceneRefs: sourceSceneRefs8,
            prompt: prompt3,
          },
        ],
      });
    }),
    list94
  );
}
export function parseStoryAssetKindExtractionResult(
  value319,
  {
    kind: kind = 'character',
    sourceScenes: sourceScenes = [],
    chapterIds: chapterIds = [],
    visualStyle: visualStyle = '',
  } = {},
) {
  const kind4 = normalizeStoryAssetKind(kind),
    map42 = new Set(sourceScenes.map((value320) => value320.ref)),
    map43 = new Set(sourceScenes.map((value321) => value321.episodeRef)),
    list96 = getStoryAssetKindRawAssets(value319, kind4),
    value322 = list96.map((description3, value323) => {
      if (!description3 || typeof description3 !== 'object' || Array.isArray(description3)) return null;
      const name15 = normalizeText(description3.name);
      if (!name15) return null;
      let sourceSceneRefs9 = normalizeStringArray(
        description3.sourceSceneRefs || description3.sceneRefs,
      ).filter((value324) => map42.has(value324));
      !sourceSceneRefs9.length &&
        (sourceSceneRefs9 = inferStoryAssetSourceSceneRefs(kind4, name15, sourceScenes));
      const sourceEpisodeRefs7 = normalizeStringArray([
          ...deriveSourceEpisodeRefs(
            sourceSceneRefs9,
            new Map(sourceScenes.map((value325) => [value325.ref, value325])),
          ),
          ...normalizeStringArray(description3.sourceEpisodeRefs || description3.sourceChapterIds).filter((value326) => map43.has(value326)),
        ]),
        sourceChapterIds3 = resolveStoryAssetSourceChapterIds({
          sourceSceneRefs: sourceSceneRefs9,
          sourceEpisodeRefs: sourceEpisodeRefs7,
          sourceScenes: sourceScenes,
          chapterIds: chapterIds,
        }),
        ref19 = normalizeReference(description3.ref, kind4 + '-' + (value323 + 1)),
        text19 = normalizeText(description3.prompt || description3.description || name15 + '视觉设定'),
        list97 =
          kind4 === 'character' &&
          Array.isArray(description3.appearances) &&
          description3.appearances.length
            ? description3.appearances
            : [
                {
                  name: '基础形象',
                  description: description3.description,
                  occurrences: description3.occurrences,
                  sourceSceneRefs: sourceSceneRefs9,
                  prompt: description3.prompt || description3.appearances?.[0]?.prompt,
                },
              ],
        appearances6 = list97.map((error45, count11) => {
          const list98 = normalizeStringArray(error45?.sourceSceneRefs || error45?.sceneRefs).filter((value327) => map42.has(value327)),
            sourceSceneRefs10 = list98.length ? list98 : sourceSceneRefs9,
            sourceEpisodeRefs8 = deriveSourceEpisodeRefs(
              sourceSceneRefs10,
              new Map(sourceScenes.map((value328) => [value328.ref, value328])),
            ),
            sourceChapterIds4 = resolveStoryAssetSourceChapterIds({
              sourceSceneRefs: sourceSceneRefs10,
              sourceEpisodeRefs: sourceEpisodeRefs8,
              sourceScenes: sourceScenes,
              chapterIds: chapterIds,
            });
          return {
            ref: normalizeReference(error45?.ref, ref19 + '-appearance-' + (count11 + 1)),
            name:
              normalizeText(error45?.name) || (count11 === 0 ? '基础形象' : '形象 ' + (count11 + 1)),
            description: normalizeText(error45?.description || description3.description),
            occurrences:
              normalizeText(error45?.occurrences || description3.occurrences) ||
              buildOccurrences(sourceEpisodeRefs8),
            sourceChapterIds: sourceChapterIds4,
            sourceEpisodeRefs: sourceEpisodeRefs8,
            sourceSceneRefs: sourceSceneRefs10,
            prompt: ensureStoryAssetVisualStyle(error45?.prompt || text19, visualStyle),
          };
        });
      return {
        ref: ref19,
        kind: kind4,
        name: name15,
        role:
          kind4 === 'character'
            ? resolveStoryCharacterRole(description3.role)
            : normalizeText(description3.role) || (kind4 === 'scene' ? '剧情场景' : '关键道具'),
        description: normalizeText(description3.description),
        voiceDescription: kind4 === 'character' ? normalizeText(description3.voiceDescription) : '',
        occurrences: normalizeText(description3.occurrences) || buildOccurrences(sourceEpisodeRefs7),
        sourceChapterIds: sourceChapterIds3,
        sourceEpisodeRefs: sourceEpisodeRefs7,
        sourceSceneRefs: sourceSceneRefs9,
        appearances: appearances6,
      };
    }).filter(Boolean),
    storyAssetKindResultAssets = mergeStoryAssetKindResultAssets(value322),
    assets10 =
      kind4 === 'scene'
        ? normalizeStorySceneAssetsForCoverage(storyAssetKindResultAssets, {
            sourceScenes: sourceScenes,
            chapterIds: chapterIds,
            visualStyle: visualStyle,
          })
        : storyAssetKindResultAssets,
    value329 = new Set(),
    value330 = new Set();
  return (
    assets10.forEach((value331, value332) => {
      ((value331.ref = createUniqueStoryAssetInventoryRef(
        value331.ref,
        value329,
        kind4 + '-' + (value332 + 1),
      )),
        (value331.appearances = value331.appearances.map((args40, value333) => ({
          ...args40,
          ref: createUniqueStoryAssetAppearanceRef(
            args40.ref,
            value330,
            value331.ref + '-appearance-' + (value333 + 1),
          ),
        }))));
    }),
    { schemaVersion: STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION, kind: kind4, assets: assets10 }
  );
}
function cloneStoryAssetExtractionValue(enabled15) {
  if (!enabled15 || typeof enabled15 !== 'object') return null;
  try {
    return JSON.parse(JSON.stringify(enabled15));
  } catch {
    return null;
  }
}
function hashStoryAssetExtractionValue(value334) {
  const list99 = JSON.stringify(value334);
  let value335 = 0x811c9dc5;
  for (let value336 = 0; value336 < list99.length; value336 += 1) {
    ((value335 ^= list99.charCodeAt(value336)), (value335 = Math.imul(value335, 0x1000193)));
  }
  return (
    STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION +
    '-' +
    (value335 >>> 0).toString(16).padStart(8, '0') +
    '-' +
    list99.length
  );
}
function createStoryAssetExtractionFingerprint({
  storyContext: storyContext = {},
  sourceScenes: sourceScenes = [],
  model: model = '',
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  aspectRatio: aspectRatio = '',
  visualStyle: visualStyle = '',
  extractionStrategy: extractionStrategy = STORY_ASSET_EXTRACTION_DRAFT_STRATEGY,
} = {}) {
  return hashStoryAssetExtractionValue({
    title: storyContext.title,
    scriptMode: storyContext.scriptMode,
    continuityFacts: storyContext.continuityFacts,
    characters: storyContext.characters,
    sourceScenes: sourceScenes,
    model: normalizeText(model),
    provider: normalizeText(provider),
    providerProfileId: normalizeText(providerProfileId),
    aspectRatio: normalizeText(aspectRatio) || storyContext.aspectRatio,
    visualStyle: normalizeText(visualStyle) || storyContext.visualStyle,
    extractionStrategy: extractionStrategy,
    extractionKinds: STORY_ASSET_EXPERIMENTAL_KINDS,
  });
}
function createStoryAssetExtractionContentFingerprint({
  storyContext: storyContext = {},
  sourceScenes: sourceScenes = [],
  aspectRatio: aspectRatio = '',
  visualStyle: visualStyle = '',
  extractionStrategy: extractionStrategy = STORY_ASSET_EXTRACTION_DRAFT_STRATEGY,
} = {}) {
  return hashStoryAssetExtractionValue({
    title: storyContext.title,
    scriptMode: storyContext.scriptMode,
    continuityFacts: storyContext.continuityFacts,
    characters: storyContext.characters,
    sourceScenes: sourceScenes,
    aspectRatio: normalizeText(aspectRatio) || storyContext.aspectRatio,
    visualStyle: normalizeText(visualStyle) || storyContext.visualStyle,
    extractionStrategy: extractionStrategy,
    extractionKinds: STORY_ASSET_EXPERIMENTAL_KINDS,
  });
}
async function saveStoryAssetExtractionCheckpoint(args41, handler7) {
  const value337 = { ...args41, updatedAt: Date.now() };
  return (
    typeof handler7 === 'function' && (await handler7(cloneStoryAssetExtractionValue(value337))),
    value337
  );
}
function classifyStoryAssetKindError(error46) {
  const message2 = normalizeText(error46?.message || error46),
    text20 = normalizeText(error46?.type || error46?.code).toUpperCase();
  if (
    text20 === 'AUTH_ERROR' ||
    Number(error46?.status) === 401 ||
    /API\s*Key.*(?:无效|过期|未配置|错误)|认证失败|unauthori[sz]ed|invalid\s+api\s+key/iu.test(message2)
  )
    return { type: 'auth', message: message2 };
  if (
    text20 === 'RATE_LIMIT' ||
    Number(error46?.status || error46?.statusCode) === 429 ||
    /rate\s*limit|too\s*many\s*requests|限流|请求过于频繁/iu.test(message2)
  )
    return { type: 'rate-limit', message: message2 };
  if (text20 === 'TIMEOUT' || /超时|timeout|timed\s*out/iu.test(message2))
    return { type: 'timeout', message: message2 };
  if (
    text20 === 'DNS_ERROR' ||
    text20 === 'ENOTFOUND' ||
    text20 === 'EAI_AGAIN' ||
    /dns|name\s+resolution|getaddrinfo|域名解析/iu.test(message2)
  )
    return { type: 'dns-error', message: message2 };
  if (
    text20 === 'NETWORK_ERROR' ||
    /fetch\s+failed|failed\s+to\s+fetch|network\s+(?:error|failure)|网络(?:错误|异常|失败)/iu.test(
      message2,
    )
  )
    return { type: 'network-error', message: message2 };
  if (
    ['ECONNRESET', 'ECONNABORTED', 'UND_ERR_SOCKET'].includes(
      normalizeText(error46?.code).toUpperCase(),
    ) ||
    /connection\s*(?:reset|closed|aborted)|socket\s*hang\s*up|连接(?:被)?重置|连接中断/iu.test(message2)
  )
    return { type: 'connection-reset', message: message2 };
  if (
    text20 === 'OUTPUT_LENGTH' ||
    /max(?:imum)?\s*(?:output\s*)?tokens|finish[_\s-]*reason.{0,12}length|输出.{0,8}(?:截断|过长)|内容过长/iu.test(message2)
  )
    return { type: 'length', message: message2 };
  if (text20 === 'CALL_LIMIT') return { type: 'call-limit', message: message2 };
  if (
    text20 === 'VALIDATION' ||
    error46?.validationDetails ||
    /Agent 返回的.+(?:声音设定|图片提示词).*(?:缺少|不能为空)|形象数量与轻量清单不一致/iu.test(message2)
  )
    return { type: 'validation', message: message2 };
  if (/资产细化结果必须与当前批次资产数量完全一致|缺少\s*\d+\s*个资产结果/u.test(message2))
    return { type: 'incomplete-output', message: message2 };
  if (/有效的\s*JSON|JSON|缺少\s*assets\s*数组|返回格式/iu.test(message2))
    return { type: 'invalid-json', message: message2 };
  return { type: 'request', message: message2 };
}
function isStoryAssetConfirmedUnchargedRejection(response6) {
  const value338 = Number(response6?.status ?? response6?.statusCode);
  return [400, 401, 403, 404, 409, 422, 429].includes(value338);
}
function getStoryAssetKindErrorLabel(type4 = '', message3 = '') {
  if (type4 === 'auth' || classifyStoryAssetKindError({ type: type4, message: message3 }).type === 'auth')
    return 'API Key 无效或已过期';
  if (type4 === 'timeout') return '请求超时';
  if (type4 === 'rate-limit') return '请求限流';
  if (type4 === 'length') return '输出被截断';
  if (type4 === 'call-limit') return '达到自动调用上限';
  if (type4 === 'validation') return '结果校验失败';
  if (type4 === 'incomplete-output') return '输出缺少部分资产';
  if (type4 === 'invalid-json') return '返回格式不合格';
  return '请求失败';
}
function getStoryAssetResponseFinishReason(value339) {
  return normalizeText(
    value339?.finishReason ||
      value339?.finish_reason ||
      value339?.choices?.[0]?.finish_reason ||
      value339?.data?.choices?.[0]?.finish_reason,
  );
}
function isStoryAssetResponseTruncated(value340) {
  const value341 =
    typeof value340 === 'string'
      ? normalizeText(value340).toLowerCase()
      : getStoryAssetResponseFinishReason(value340).toLowerCase();
  return ['length', 'max_tokens', 'max_output_tokens'].includes(value341);
}
function createStoryAssetPipelineError(list100 = []) {
  const value342 = list100.slice(0, 5)
      .map((value343) => {
        const value344 =
            value343.stage === 'kind'
              ? STORY_ASSET_KIND_LABELS[value343.kind] || '资产'
              : value343.stage === 'repair'
                ? '归并校验'
                : value343.stage === 'detail'
                  ? '提示词细化'
                  : '清单',
          text21 = normalizeText(value343.batchLabel || value343.batchId);
        return (
          '' +
          value344 +
          (text21 ? ' ' + text21 : '') +
          '（' +
          getStoryAssetKindErrorLabel(value343.errorType, value343.errorMessage) +
          '）'
        );
      })
      .join('、'),
    error47 = new Error(
      '资产提取未完成：' + (value342 || '存在未完成工作项') + '。已完成结果已保存，再次点击只处理未完成项。',
    );
  return ((error47.assetExtractionFailures = list100), error47);
}
function createStoryAssetPipelineContinuation(value345, value346, value347 = {}) {
  const error48 = new Error(value346);
  return (
    (error48.type = 'ASSET_EXTRACTION_CONTINUE_REQUIRED'),
    (error48.isContinuation = true),
    (error48.remaining = cloneStoryAssetExtractionValue(value347)),
    (error48.assetExtractionDraft = cloneStoryAssetExtractionValue(value345)),
    error48
  );
}
function createStoryAssetBatchContractKey(value348, value349 = []) {
  const list101 = JSON.stringify({
    stage: normalizeText(value348),
    identities: normalizeStringArray(value349),
  });
  let value350 = 0x811c9dc5;
  for (let value351 = 0; value351 < list101.length; value351 += 1) {
    ((value350 ^= list101.charCodeAt(value351)), (value350 = Math.imul(value350, 0x1000193)));
  }
  return (
    (normalizeText(value348) || 'batch') + '-' + (value350 >>> 0).toString(16).padStart(8, '0')
  );
}
function createStoryAssetPipelineKindStates(
  list102 = [],
  list103 = [],
  list104 = [],
  { inventoryRunning: inventoryRunning = false } = {},
) {
  const map44 = new Set(list103.map((value352) => value352.ref));
  return Object.fromEntries(
    STORY_ASSET_EXPERIMENTAL_KINDS.map((kind5) => {
      const totalAssetCount = list102.filter((value353) => value353.kind === kind5),
        assetCount = totalAssetCount.filter((value354) => map44.has(value354.ref)).length,
        list105 = list104.filter((enabled16) => !enabled16.kind || enabled16.kind === kind5);
      let status2 = 'pending';
      if (inventoryRunning) status2 = 'running';
      else {
        if (totalAssetCount.length && assetCount === totalAssetCount.length) status2 = 'succeeded';
        else {
          if (list105.length) status2 = 'failed';
          else {
            if (assetCount || totalAssetCount.length) status2 = 'running';
          }
        }
      }
      const errorType = list105[0];
      return [
        kind5,
        {
          kind: kind5,
          status: status2,
          attempt: 0,
          assetCount: assetCount,
          totalAssetCount: totalAssetCount.length,
          errorType: errorType?.errorType || '',
          errorMessage: errorType?.errorMessage || '',
          startedAt: 0,
          finishedAt: status2 === 'succeeded' || status2 === 'failed' ? Date.now() : 0,
        },
      ];
    }),
  );
}
function restoreStoryAssetPipelineDraft(
  value355,
  {
    sourceFingerprint: sourceFingerprint = '',
    sourceContentFingerprint: sourceContentFingerprint = '',
    extractionStrategy: extractionStrategy = STORY_ASSET_EXTRACTION_DRAFT_STRATEGY,
  } = {},
) {
  const cloneStoryAssetExtractionValue2 = cloneStoryAssetExtractionValue(value355);
  if (
    !cloneStoryAssetExtractionValue2 ||
    cloneStoryAssetExtractionValue2.strategy !== extractionStrategy ||
    cloneStoryAssetExtractionValue2.schemaVersion !== STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION
  )
    return null;
  const text22 = normalizeText(cloneStoryAssetExtractionValue2.sourceFingerprint) === sourceFingerprint,
    value356 = Boolean(
      normalizeText(cloneStoryAssetExtractionValue2.sourceContentFingerprint) &&
      normalizeText(cloneStoryAssetExtractionValue2.sourceContentFingerprint) === sourceContentFingerprint,
    );
  return text22 || value356 ? cloneStoryAssetExtractionValue2 : null;
}
function splitStoryAssetWorkItems(list106 = []) {
  const value357 = Math.max(1, Math.ceil(list106.length / 2));
  return [list106.slice(0, value357), list106.slice(value357)].filter(
    (list107) => list107.length,
  );
}
function updateStoryAssetOutputEstimates(args42 = {}, list108 = []) {
  const value358 = { ...args42 };
  return (
    STORY_ASSET_EXPERIMENTAL_KINDS.forEach((value359) => {
      const list109 = list108.filter((value360) => value360.kind === value359);
      if (!list109.length) return;
      const value361 = Math.ceil(
          list109.reduce((value362, value363) => value362 + JSON.stringify(value363).length, 0) /
            list109.length,
        ),
        value364 = Math.max(
          600,
          Number(value358[value359]) || (value359 === 'character' ? 2200 : 1200),
        );
      value358[value359] = Math.max(600, Math.ceil(value364 * 0.65 + value361 * 0.35));
    }),
    value358
  );
}
function reportStoryAssetDiagnostics(value365, value366, level = {}) {
  try {
    const promise =
      typeof value365?.info === 'function'
        ? value365.info(value366, level)
        : value365?.logEvent?.({
            type:
              'story_asset.' +
              normalizeText(value366)
                .replace(/^story-asset-?/iu, '')
                .replace(/[^a-z0-9]+/giu, '_'),
            level: level?.status === 'failed' ? 'error' : 'info',
            source: 'renderer',
            message: normalizeText(value366) || 'Story asset extraction event',
            context: level,
          });
    promise &&
      typeof promise.then === 'function' &&
      void Promise.resolve(promise).catch(() => undefined);
  } catch {}
}
function buildStoryAssetBaselinePrompt(error49 = {}, error50 = {}, value367 = '') {
  const text23 = normalizeText(error49.kind),
    stringArray2 = normalizeStringArray(
      [
        error49.name,
        error49.scriptFacts || error49.description,
        error49.visualDesign,
        error50.name && error50.name !== '基础形象' ? error50.name : '',
        error50.scriptFacts || error50.description,
        error50.visualDesign,
      ].map(sanitizeStoryAssetPublicPromptText),
    ).join('，'),
    value368 =
      text23 === 'character'
        ? '正面全身独立人物设定图，中性站姿，无剧情动作、无手持或背负道具，完整展示服装、发型、五官与体态'
        : text23 === 'scene'
          ? '环境概念设定图，默认无人，完整展示空间布局、时间状态、光线与关键环境结构'
          : '单体道具设定图，默认无人手持，完整展示轮廓、材质、结构与剧情要求的状态';
  return ensureStoryAssetVisualStyle([stringArray2, value368].filter(Boolean).join('，'), value367);
}
function createStoryAssetBaselineVisualDesign(error51 = {}) {
  const text24 = normalizeText(error51?.name) || '该资产',
    text25 = normalizeText(error51?.kind);
  if (text25 === 'character')
    return (
      text24 +
      '的外观符合' +
      (normalizeText(error51?.role) || '剧情角色') +
      '身份与项目时代背景，形成稳定、可复用的人物设定'
    );
  if (text25 === 'scene') return text24 + '的空间布局、结构材质、时间光线与剧本场景标题及项目世界观保持一致';
  return text24 + '的轮廓、材质、尺寸与关键结构符合剧本用途，形成清晰可辨的单体道具设定';
}
function sanitizeStoryAssetPublicAsset(description4 = {}, { visualStyle: visualStyle = '' } = {}) {
  const text26 = normalizeText(description4?.designStatus) === 'baseline',
    scriptFacts = stripStoryAssetInternalEvidenceMetadata(
      description4?.scriptFacts || description4?.description,
    ),
    visualDesign =
      stripStoryAssetInternalEvidenceMetadata(description4?.visualDesign) ||
      (text26 ? createStoryAssetBaselineVisualDesign(description4) : ''),
    description5 = formatStoryAssetFactAndDesignDescription({
      scriptFacts: scriptFacts,
      visualDesign: visualDesign,
      description: description4?.description,
    }),
    appearances7 = (Array.isArray(description4?.appearances) ? description4.appearances : []).map((description6) => {
      const prompt4 = text26 || normalizeText(description6?.designStatus) === 'baseline',
        scriptFacts2 = stripStoryAssetInternalEvidenceMetadata(
          description6?.scriptFacts || description6?.description || scriptFacts,
        ),
        visualDesign2 =
          stripStoryAssetInternalEvidenceMetadata(description6?.visualDesign) ||
          (prompt4 ? visualDesign : ''),
        description7 = formatStoryAssetFactAndDesignDescription({
          scriptFacts: scriptFacts2,
          visualDesign: visualDesign2,
          description: description6?.description,
        }),
        args43 = {
          ...description6,
          description: description7,
          scriptFacts: scriptFacts2,
          visualDesign: visualDesign2,
        };
      return {
        ...args43,
        prompt: prompt4
          ? buildStoryAssetBaselinePrompt(
              {
                ...description4,
                description: description5,
                scriptFacts: scriptFacts,
                visualDesign: visualDesign,
              },
              args43,
              visualStyle,
            )
          : ensureStoryAssetVisualStyle(description6?.prompt, visualStyle),
      };
    });
  return {
    ...description4,
    description: description5,
    scriptFacts: scriptFacts,
    visualDesign: visualDesign,
    appearances: appearances7,
    prompt:
      appearances7[0]?.prompt || ensureStoryAssetVisualStyle(description4?.prompt, visualStyle),
  };
}
export function finalizeStoryAssetInventoryAssets({
  inventory: inventory = {},
  sourceScenes: sourceScenes = [],
  chapterIds: chapterIds = [],
  visualStyle: visualStyle = '',
} = {}) {
  return (Array.isArray(inventory?.assets) ? inventory.assets : []).map((sourceSceneRefs11) => {
    const sourceChapterIds5 = resolveStoryAssetSourceChapterIds({
        sourceSceneRefs: sourceSceneRefs11.sourceSceneRefs,
        sourceEpisodeRefs: sourceSceneRefs11.sourceEpisodeRefs,
        sourceScenes: sourceScenes,
        chapterIds: chapterIds,
      }),
      prompt5 = (Array.isArray(sourceSceneRefs11.appearances) ? sourceSceneRefs11.appearances : []).map((sourceSceneRefs12) => {
        const sourceChapterIds6 = resolveStoryAssetSourceChapterIds({
          sourceSceneRefs: sourceSceneRefs12.sourceSceneRefs,
          sourceEpisodeRefs: sourceSceneRefs12.sourceEpisodeRefs,
          sourceScenes: sourceScenes,
          chapterIds: chapterIds,
        });
        return {
          ...sourceSceneRefs12,
          sourceChapterIds: sourceChapterIds6,
          prompt: buildStoryAssetBaselinePrompt(sourceSceneRefs11, sourceSceneRefs12, visualStyle),
          designStatus: 'baseline',
        };
      });
    return {
      ...sourceSceneRefs11,
      role:
        sourceSceneRefs11.kind === 'character'
          ? normalizeStoryAssetFinalCharacterRole(sourceSceneRefs11.role)
          : sourceSceneRefs11.role,
      voiceDescription: '',
      sourceChapterIds: sourceChapterIds5,
      prompt: prompt5[0]?.prompt || '',
      appearances: prompt5,
      designStatus: 'baseline',
    };
  });
}
function createStoryAssetDetailPlans({
  inventory: inventory = {},
  sourceScenes: sourceScenes = [],
  chapterIds: chapterIds = [],
} = {}) {
  return finalizeStoryAssetInventoryAssets({
    inventory: inventory,
    sourceScenes: sourceScenes,
    chapterIds: chapterIds,
  }).map((ref20) => ({
    ref: ref20.ref,
    kind: ref20.kind,
    name: ref20.name,
    role: ref20.role,
    description: ref20.description,
    occurrences: normalizeStringArray(ref20.sourceChapterIds).length
      ? buildOccurrences(ref20.sourceChapterIds)
      : normalizeText(ref20.occurrences),
    sourceSceneRefs: normalizeStringArray(ref20.sourceSceneRefs),
    sourceEpisodeRefs: normalizeStringArray(ref20.sourceChapterIds),
    appearances: (Array.isArray(ref20.appearances) ? ref20.appearances : []).map((ref21) => ({
      ref: ref21.ref,
      name: ref21.name,
      description: ref21.description,
      occurrences: normalizeStringArray(ref21.sourceChapterIds).length
        ? buildOccurrences(ref21.sourceChapterIds)
        : normalizeText(ref21.occurrences),
      sourceSceneRefs: normalizeStringArray(ref21.sourceSceneRefs),
      sourceEpisodeRefs: normalizeStringArray(ref21.sourceChapterIds),
    })),
  }));
}
function createStoryAssetBaselineDetailAssets(
  list110 = [],
  { sourceScenes: sourceScenes = [], visualStyle: visualStyle = '' } = {},
) {
  const map45 = new Map(sourceScenes.map((value369) => [value369.ref, value369]));
  return list110.map((ref22) => {
    const stringArray3 = normalizeStringArray(
        ref22.sourceSceneRefs
          .map((value370) => map45.get(value370))
          .filter(Boolean)
          .slice(0, 2)
          .map((dom5) =>
            [
              normalizeText(dom5.heading),
              stripStoryAssetInternalEvidenceMetadata(dom5.body).slice(0, 160),
            ]
              .filter(Boolean)
              .join('：'),
          ),
      ).join('；'),
      scriptFacts3 =
        stripStoryAssetInternalEvidenceMetadata(ref22.description) ||
        stringArray3 ||
        ref22.name + '在剧本相关场次中出现。',
      visualDesign3 = createStoryAssetBaselineVisualDesign(ref22),
      description8 = formatStoryAssetFactAndDesignDescription({
        scriptFacts: scriptFacts3,
        visualDesign: visualDesign3,
      }),
      prompt6 = ref22.appearances.map((ref23) => ({
        ref: ref23.ref,
        name: ref23.name,
        description: normalizeText(ref23.description) || description8,
        occurrences: buildOccurrences(ref23.sourceEpisodeRefs),
        prompt: buildStoryAssetBaselinePrompt(
          { ...ref22, description: description8, scriptFacts: scriptFacts3, visualDesign: visualDesign3 },
          {
            ...ref23,
            scriptFacts: stripStoryAssetInternalEvidenceMetadata(ref23.description) || scriptFacts3,
            visualDesign: visualDesign3,
          },
          visualStyle,
        ),
        sourceChapterIds: ref23.sourceEpisodeRefs,
        sourceEpisodeRefs: ref23.sourceEpisodeRefs,
        sourceSceneRefs: ref23.sourceSceneRefs,
        scriptFacts: scriptFacts3,
        visualDesign: visualDesign3,
        designStatus: 'baseline',
      }));
    return {
      ref: ref22.ref,
      kind: ref22.kind,
      name: ref22.name,
      role: ref22.role,
      description: description8,
      voiceDescription:
        ref22.kind === 'character'
          ? [
              '年龄：未明确',
              '性别：未明确',
              '身份：' + (ref22.role || '剧情角色'),
              '口音：标准普通话',
              '情绪底色：中性克制',
              '声线：自然清晰',
              '语速：中等',
              '说话方式：符合角色身份',
              '音色特征：自然稳定',
            ].join('；')
          : '',
      occurrences: buildOccurrences(ref22.sourceEpisodeRefs),
      prompt: prompt6[0]?.prompt || '',
      sourceChapterIds: ref22.sourceEpisodeRefs,
      sourceEpisodeRefs: ref22.sourceEpisodeRefs,
      sourceSceneRefs: ref22.sourceSceneRefs,
      appearances: prompt6,
      scriptFacts: scriptFacts3,
      visualDesign: visualDesign3,
      designStatus: 'baseline',
    };
  });
}
export async function extractStoryAssetsEvidenceBatched({
  project: project = {},
  episodes: episodes = [],
  sourceScenes: sourceScenes7 = null,
  authoritativeSourceScenes: authoritativeSourceScenes = null,
  model: model = '',
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  aspectRatio: aspectRatio = '',
  visualStyle: visualStyle = '',
  request: request = generateText,
  onProgress: onProgress = null,
  onCheckpoint: onCheckpoint = null,
  resumeDraft: resumeDraft = null,
  diagnostics: diagnostics = null,
  requestLimit: requestLimit = STORY_ASSET_AUTOMATIC_CALL_LIMIT,
  allowLocalBaselineFallback: allowLocalBaselineFallback = true,
  paidRerunAuthorization: paidRerunAuthorization = null,
} = {}) {
  request = withReplicationRequestPolicy(request, project);
  const model2 = normalizeText(model),
    provider2 = normalizeText(provider),
    providerProfileId2 = normalizeText(providerProfileId);
  if (!model2 || !provider2) throw new Error('请先选择可用的文本模型。');
  const storyContext3 = normalizeStoryContext(project),
    sourceScenes8 =
      Array.isArray(sourceScenes7) && sourceScenes7.length
        ? cloneStoryAssetExtractionValue(sourceScenes7)
        : normalizeStoryAssetExtractionSources(episodes),
    map46 = new Map(
      (Array.isArray(authoritativeSourceScenes) ? authoritativeSourceScenes : []).map((value371) => [
        value371?.ref,
        value371,
      ]),
    ),
    sourceScenes9 = sourceScenes8.map((args44) => {
      const enabled17 = map46.get(args44?.ref);
      if (!enabled17) return args44;
      return { ...args44, characters: cloneStoryAssetExtractionValue(enabled17.characters || []) };
    }),
    visualStyle2 = normalizeText(visualStyle) || storyContext3.visualStyle,
    sourceFingerprint2 = createStoryAssetExtractionFingerprint({
      storyContext: storyContext3,
      sourceScenes: sourceScenes8,
      model: model2,
      provider: provider2,
      providerProfileId: providerProfileId2,
      aspectRatio: aspectRatio,
      visualStyle: visualStyle2,
      extractionStrategy: STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY,
    }),
    sourceContentFingerprint2 = createStoryAssetExtractionContentFingerprint({
      storyContext: storyContext3,
      sourceScenes: sourceScenes8,
      aspectRatio: aspectRatio,
      visualStyle: visualStyle2,
      extractionStrategy: STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY,
    }),
    cloneStoryAssetExtractionValue3 = cloneStoryAssetExtractionValue(resumeDraft),
    restoreStoryAssetPipelineDraft2 = restoreStoryAssetPipelineDraft(resumeDraft, {
      sourceFingerprint: sourceFingerprint2,
      sourceContentFingerprint: sourceContentFingerprint2,
      extractionStrategy: STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY,
    }),
    value372 =
      cloneStoryAssetExtractionValue3?.batchSubmissionRecords &&
      typeof cloneStoryAssetExtractionValue3.batchSubmissionRecords === 'object'
        ? cloneStoryAssetExtractionValue3.batchSubmissionRecords
        : {},
    list111 =
      !restoreStoryAssetPipelineDraft2 &&
      cloneStoryAssetExtractionValue3?.strategy === STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY
        ? Object.entries(value372).flatMap(([value373, response7]) => {
            const text27 = normalizeText(response7?.status),
              value374 =
                text27 !== 'rejected-confirmed' &&
                (Math.max(0, Math.trunc(Number(response7?.requestCount) || 0)) > 0 ||
                  Object.hasOwn(response7 || {}, 'rawResponse') ||
                  [
                    'submitted',
                    'ambiguous',
                    'blocked-ambiguous-submission',
                    'response-received',
                    'blocked-paid-response',
                    'blocked-incompatible',
                    'validated',
                  ].includes(text27));
            return value374 ? [value373] : [];
          })
        : [],
    enabled18 = list111.length > 0,
    callLimit = Math.min(
      STORY_ASSET_BATCH_REQUEST_LIMIT,
      Math.max(1, Math.trunc(Number(requestLimit) || 0)),
    );
  let requestCount = 0,
    enabled19 = false,
    fallbackReason = '';
  const run5 = (paidBatchHistory = {}) => ({
    strategy: STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY,
    schemaVersion: STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION,
    sourceFingerprint: sourceFingerprint2,
    sourceContentFingerprint: sourceContentFingerprint2,
    status: 'pending',
    phase: 'inventory',
    inventoryBatches: [],
    inventory: null,
    completedAssets: [],
    detailBatches: [],
    batchSubmissionRecords: {},
    paidBatchHistory: {},
    outputEstimates: { character: 2200, scene: 1200, prop: 1200 },
    failures: [],
    totalRequestCount: 0,
    ...(paidBatchHistory && typeof paidBatchHistory === 'object'
      ? { paidBatchHistory: paidBatchHistory }
      : {}),
  });
  let current2 = restoreStoryAssetPipelineDraft2 || (enabled18 ? cloneStoryAssetExtractionValue3 : run5());
  current2.strategy = STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY;
  !enabled18 &&
    ((current2.schemaVersion = STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION),
    (current2.sourceFingerprint = sourceFingerprint2),
    (current2.sourceContentFingerprint = sourceContentFingerprint2));
  ((current2.failures = []),
    (current2.runRequestCount = 0),
    (current2.requestLimit = callLimit),
    (current2.batchSubmissionRecords =
      current2.batchSubmissionRecords && typeof current2.batchSubmissionRecords === 'object'
        ? current2.batchSubmissionRecords
        : {}),
    (current2.paidBatchHistory =
      current2.paidBatchHistory && typeof current2.paidBatchHistory === 'object'
        ? current2.paidBatchHistory
        : {}));
  const run6 = async ({ message: message = '', stage: stage = current2.phase } = {}) => {
      const list112 = Array.isArray(current2.inventory?.assets)
          ? current2.inventory.assets
          : [],
        list113 = Array.isArray(current2.completedAssets) ? current2.completedAssets : [],
        current3 = stage === 'inventory' || stage === 'repair';
      ((current2.kindStates = createStoryAssetPipelineKindStates(list112, list113, current2.failures, {
        inventoryRunning: stage === 'inventory' && current2.status === 'in-progress',
      })),
        (current2.progress = {
          stage: stage,
          current: current3
            ? new Set(
                (current2.inventoryBatches || [])
                  .filter((response8) => response8.status === 'succeeded')
                  .flatMap((value375) => value375.sourceSceneRefs || []),
              ).size
            : list113.length,
          total: current3 ? sourceScenes9.length : list112.length,
          message: message,
          requestCount: requestCount,
          callLimit: callLimit,
        }),
        (current2 = await saveStoryAssetExtractionCheckpoint(current2, onCheckpoint)),
        onProgress?.({
          stage:
            stage === 'repair'
              ? 'repairing-asset-inventory'
              : stage === 'detail'
                ? 'detailing-story-assets'
                : 'extracting-asset-inventory',
          current: current2.progress.current,
          total: current2.progress.total,
          message: message,
        }));
    },
    handler8 = (value376) => {
      if (paidRerunAuthorization?.confirmed !== true) return false;
      const list114 = Array.isArray(paidRerunAuthorization?.authorizedBatchIds)
        ? paidRerunAuthorization.authorizedBatchIds
        : [];
      return list114.includes(value376);
    },
    handler9 = (value377, archiveReason) => {
      const enabled20 = current2.batchSubmissionRecords[value377];
      if (!enabled20) return;
      const list115 = Array.isArray(current2.paidBatchHistory[value377])
        ? current2.paidBatchHistory[value377]
        : [];
      (list115.push({
        ...cloneStoryAssetExtractionValue(enabled20),
        archivedAt: Date.now(),
        archiveReason: archiveReason,
      }),
        (current2.paidBatchHistory[value377] = list115),
        delete current2.batchSubmissionRecords[value377]);
    },
    handler10 = (value378, value379, value380, value381) => {
      const error52 = new Error(value381);
      return (
        (error52.type = value378),
        (error52.batchKey = value379),
        (error52.batchId = value380?.batchId || ''),
        (error52.assetExtractionDraft = cloneStoryAssetExtractionValue(current2)),
        error52
      );
    };
  if (enabled18) {
    const enabled21 = list111.every((value382) => handler8(value382));
    if (!enabled21) {
      (list111.forEach((value383) => {
        const response9 = current2.batchSubmissionRecords[value383];
        if (!response9) return;
        (response9.status !== 'blocked-incompatible' &&
          (response9.incompatiblePreviousStatus = response9.status),
          (response9.status = 'blocked-incompatible'),
          (response9.errorType = 'contract-incompatible'),
          (response9.errorMessage = '已付费批次的来源或草稿版本与当前请求不兼容。'),
          (response9.blockedAt = Date.now()));
      }),
        (current2.status = 'blocked'),
        await run6({
          stage: current2.phase,
          message: '已付费批次与当前剧本来源或草稿版本不兼容；未自动重新请求',
        }));
      const [value384] = list111,
        value385 = current2.batchSubmissionRecords[value384] || {},
        value386 = handler10(
          'ASSET_CONTRACT_INCOMPATIBLE',
          value384,
          value385,
          '已付费批次与当前剧本来源或草稿版本不兼容；需要逐批明确授权后才能重新请求。',
        );
      value386.blockedBatchIds = [...list111];
      throw value386;
    }
    const value387 = Math.max(0, Math.trunc(Number(current2.totalRequestCount) || 0));
    list111.forEach((value388) => {
      handler9(value388, 'authorized-source-or-schema-change-rerun');
    });
    const cloneStoryAssetExtractionValue4 =
      cloneStoryAssetExtractionValue(current2.paidBatchHistory) || {};
    ((current2 = run5(cloneStoryAssetExtractionValue4)),
      (current2.totalRequestCount = value387),
      (current2.runRequestCount = 0),
      (current2.requestLimit = callLimit),
      await run6({ stage: 'inventory', message: '旧付费批次已归档，正在按当前剧本重新提取' }));
  }
  const run7 = async (value389, stage2 = {}) => {
      const batchKey =
          normalizeText(stage2?.batchKey) ||
          createStoryAssetBatchContractKey(
            stage2?.stage,
            stage2?.contractIdentities || [stage2?.batchId],
          ),
        response10 = current2.batchSubmissionRecords[batchKey];
      if (response10 && ['submitted', 'ambiguous'].includes(response10.status)) {
        if (handler8(batchKey)) handler9(batchKey, 'authorized-ambiguous-submission-rerun');
        else {
          ((response10.status = 'blocked-ambiguous-submission'),
            (current2.status = 'blocked'),
            await run6({
              stage: stage2?.stage,
              message: (stage2?.batchId || batchKey) + '提交状态不明确；未自动重新请求',
            }));
          throw handler10(
            'ASSET_SUBMISSION_AMBIGUOUS',
            batchKey,
            stage2,
            (stage2?.batchId || batchKey) + '请求已提交但无法确认是否计费；需要明确授权后才能重新请求。',
          );
        }
      } else {
        if (response10 && response10.status === 'blocked-ambiguous-submission') {
          if (handler8(batchKey)) handler9(batchKey, 'authorized-ambiguous-submission-rerun');
          else {
            ((current2.status = 'blocked'),
              await run6({
                stage: stage2?.stage,
                message: (stage2?.batchId || batchKey) + '提交状态不明确；未自动重新请求',
              }));
            throw handler10(
              'ASSET_SUBMISSION_AMBIGUOUS',
              batchKey,
              stage2,
              (stage2?.batchId || batchKey) +
                '请求已提交但无法确认是否计费；需要明确授权后才能重新请求。',
            );
          }
        } else {
          if (
            response10 &&
            ['response-received', 'blocked-paid-response', 'blocked-incompatible', 'validated'].includes(
              response10.status,
            )
          ) {
            if (handler8(batchKey))
              handler9(
                batchKey,
                response10.status === 'blocked-incompatible'
                  ? 'authorized-incompatible-paid-response-rerun'
                  : 'authorized-invalid-paid-response-rerun',
              );
            else {
              if (response10.status === 'blocked-incompatible') {
                current2.status = 'blocked';
                throw handler10(
                  'ASSET_CONTRACT_INCOMPATIBLE',
                  batchKey,
                  stage2,
                  (stage2?.batchId || batchKey) + '的已付费结果与当前合同不兼容；未自动重新请求。',
                );
              } else {
                if (normalizeText(response10.rawResponse)) return response10.rawResponse;
                else {
                  response10.status = 'blocked-paid-response';
                  throw handler10(
                    'ASSET_PAID_RESULT_BLOCKED',
                    batchKey,
                    stage2,
                    (stage2?.batchId || batchKey) + '已付费但返回为空；未自动重新请求。',
                  );
                }
              }
            }
          }
        }
      }
      if (requestCount >= callLimit)
        throw Object.assign(
          new Error('已达到本轮 ' + callLimit + ' 次分批请求上限。已完成结果已保存，系统将自动继续。'),
          { type: 'CALL_LIMIT' },
        );
      ((requestCount += 1),
        (current2.runRequestCount = requestCount),
        (current2.totalRequestCount =
          Math.max(0, Number(current2.totalRequestCount) || 0) + 1));
      const submittedAt = Date.now();
      ((current2.batchSubmissionRecords[batchKey] = {
        batchKey: batchKey,
        batchId: normalizeText(stage2?.batchId),
        stage: normalizeText(stage2?.stage),
        kinds: normalizeStringArray(stage2?.kinds),
        status: 'submitted',
        requestCount:
          Math.max(
            0,
            Math.trunc(Number(current2.batchSubmissionRecords[batchKey]?.requestCount) || 0),
          ) + 1,
        submittedAt: submittedAt,
        contractSnapshot: cloneStoryAssetExtractionValue(value389),
        rawResponse: '',
      }),
        await run6({
          stage: stage2?.stage,
          message: (stage2?.batchId || batchKey) + '已提交，等待付费结果',
        }),
        reportStoryAssetDiagnostics(diagnostics, 'story-asset-request', {
          ...stage2,
          status: 'started',
          requestCount: requestCount,
          callLimit: callLimit,
          promptCharacters: normalizeText(value389.prompt).length,
        }));
      let request3;
      try {
        request3 = await request(value389);
      } catch (value390) {
        const errorType2 = classifyStoryAssetKindError(value390),
          status3 = !isStoryAssetConfirmedUnchargedRejection(value390);
        current2.batchSubmissionRecords[batchKey] = {
          ...current2.batchSubmissionRecords[batchKey],
          status: status3 ? 'blocked-ambiguous-submission' : 'rejected-confirmed',
          failedAt: Date.now(),
          errorType: errorType2.type,
          errorMessage: errorType2.message,
        };
        if (status3) current2.status = 'blocked';
        (await run6({
          stage: stage2?.stage,
          message: status3
            ? (stage2?.batchId || batchKey) + '提交状态不明确；未自动重新请求'
            : (stage2?.batchId || batchKey) + '请求失败；已保存状态',
        }),
          reportStoryAssetDiagnostics(diagnostics, 'story-asset-request', {
            ...stage2,
            status: 'failed',
            requestCount: requestCount,
            elapsedMs: Math.max(0, Date.now() - submittedAt),
            errorType: errorType2.type,
            errorMessage: errorType2.message,
          }));
        if (status3)
          throw handler10(
            'ASSET_SUBMISSION_AMBIGUOUS',
            batchKey,
            stage2,
            (stage2?.batchId || batchKey) + '请求已提交但无法确认是否计费；需要明确授权后才能重新请求。',
          );
        throw value390;
      }
      const status4 = normalizeText(getResultText(request3)),
        finishReason = getStoryAssetResponseFinishReason(request3).toLowerCase();
      current2.batchSubmissionRecords[batchKey] = {
        ...current2.batchSubmissionRecords[batchKey],
        status: status4 ? 'response-received' : 'blocked-paid-response',
        responseReceivedAt: Date.now(),
        rawResponse: status4,
        ...(finishReason ? { finishReason: finishReason } : {}),
        ...(status4
          ? {}
          : {
              blockedAt: Date.now(),
              errorType: 'empty-paid-response',
              errorMessage: '付费请求返回空内容。',
            }),
      };
      if (!status4) {
        ((current2.status = 'blocked'),
          await run6({
            stage: stage2?.stage,
            message: (stage2?.batchId || batchKey) + '付费请求返回空内容；已阻断且未自动重试',
          }),
          reportStoryAssetDiagnostics(diagnostics, 'story-asset-request', {
            ...stage2,
            status: 'failed',
            requestCount: requestCount,
            elapsedMs: Math.max(0, Date.now() - submittedAt),
            errorType: 'empty-paid-response',
            errorMessage: '付费请求返回空内容。',
          }));
        throw handler10(
          'ASSET_PAID_RESULT_BLOCKED',
          batchKey,
          stage2,
          (stage2?.batchId || batchKey) + '已付费但返回为空；需要明确授权后才能重新请求。',
        );
      }
      return (
        await run6({
          stage: stage2?.stage,
          message: (stage2?.batchId || batchKey) + '已返回，正在校验付费结果',
        }),
        reportStoryAssetDiagnostics(diagnostics, 'story-asset-request', {
          ...stage2,
          status: 'succeeded',
          requestCount: requestCount,
          elapsedMs: Math.max(0, Date.now() - submittedAt),
          responseCharacters: status4.length,
        }),
        request3
      );
    },
    handler11 = (value391) => {
      if (!current2.batchSubmissionRecords[value391]) return;
      current2.batchSubmissionRecords[value391] = {
        ...current2.batchSubmissionRecords[value391],
        status: 'validated',
        validatedAt: Date.now(),
      };
    },
    handler12 = async (value392, stage3, error53) => {
      const response11 = current2.batchSubmissionRecords[value392];
      if (!response11 || !normalizeText(response11.rawResponse)) throw error53;
      ((response11.status = 'blocked-paid-response'),
        (response11.errorType = classifyStoryAssetKindError(error53).type),
        (response11.errorMessage = normalizeText(error53?.message || error53)));
      const text28 = normalizeText(error53?.finishReason || response11.finishReason).toLowerCase();
      if (text28) response11.finishReason = text28;
      ((response11.blockedAt = Date.now()),
        (current2.status = 'blocked'),
        await run6({
          stage: stage3?.stage,
          message:
            (stage3?.batchId || value392) + '付费返回未通过合同校验；原始返回已保留，未自动重新请求',
        }));
      throw handler10(
        'ASSET_PAID_RESULT_BLOCKED',
        value392,
        stage3,
        (stage3?.batchId || value392) + '付费返回未通过合同校验；需要明确授权后才能重新请求。',
      );
    },
    handler13 = async ({ stage: stage4, message: message4, remaining: remaining }) => {
      ((current2.status = 'partial'), await run6({ stage: stage4, message: message4 }));
      throw createStoryAssetPipelineContinuation(current2, message4, remaining);
    },
    handler14 = async (batchId, value393) => {
      if (!allowLocalBaselineFallback) {
        const errorMessage = normalizeText(value393) || '资产清单 API 请求不可用';
        (current2.failures.push({
          stage: 'inventory',
          batchId: batchId.id,
          batchLabel: batchId.id + '（' + batchId.sourceScenes.length + ' 场）',
          errorType: 'incomplete-ai-inventory',
          errorMessage: errorMessage,
          sourceSceneRefs: batchId.sourceScenes.map((value394) => value394.ref),
        }),
          (current2.status = 'failed'),
          await run6({
            stage: 'inventory',
            message: batchId.id + '未获得完整 API 清单；已停止且不会使用本地候选冒充正式资产',
          }));
        throw createStoryAssetPipelineError(current2.failures);
      }
      const inventory2 = createDeterministicStoryAssetInventory({
        project: project,
        sourceScenes: batchId.sourceScenes,
      });
      (current2.inventoryBatches.push({
        id: batchId.id,
        status: 'succeeded',
        sourceSceneRefs: batchId.sourceScenes.map((value395) => value395.ref),
        salvaged: false,
        localFallback: true,
        fallbackReason: normalizeText(value393) || '清单请求不可用，已使用本地确定性清单',
        inventory: inventory2,
      }),
        await run6({
          stage: 'inventory',
          message:
            batchId.id +
            '（' +
            batchId.sourceScenes.length +
            ' 场）已使用本地确定性清单；后续不会为清单自动重试',
        }));
    },
    list116 = (Array.isArray(current2.inventoryBatches) ? current2.inventoryBatches : []).filter(
      (response12) =>
        response12?.status === 'succeeded' &&
        Array.isArray(response12.sourceSceneRefs) &&
        response12.inventory,
    ),
    map47 = new Set(list116.flatMap((value396) => value396.sourceSceneRefs)),
    sourceScenes10 = sourceScenes9.filter((value397) => !map47.has(value397.ref));
  if (sourceScenes10.length) {
    ((current2.phase = 'inventory'),
      (current2.status = 'in-progress'),
      (current2.inventoryBatches = list116),
      await run6({
        stage: 'inventory',
        message: '正在建立轻量资产清单（已覆盖 ' + map47.size + '/' + sourceScenes9.length + ' 场）',
      }));
    let list117 = [];
    try {
      list117 = createStoryAssetInventorySourceBatches({ project: project, sourceScenes: sourceScenes10 }).map((sourceScenes11, value398) => ({
        id: 'inventory-' + (value398 + 1),
        sourceScenes: sourceScenes11,
      }));
    } catch (error54) {
      list117 = [
        {
          id: 'inventory-local-fallback',
          sourceScenes: sourceScenes10,
          localFallbackReason: normalizeText(error54?.message) || '清单输入超过安全窗口',
        },
      ];
    }
    while (list117.length) {
      const batchId2 = list117.shift(),
        message5 = batchId2.id + '（' + batchId2.sourceScenes.length + ' 场）',
        batchKey2 = createStoryAssetBatchContractKey(
          'inventory',
          batchId2.sourceScenes.map((value399) => value399.ref),
        ),
        value400 = {
          stage: 'inventory',
          batchId: batchId2.id,
          batchKey: batchKey2,
          kinds: STORY_ASSET_EXPERIMENTAL_KINDS,
          contractIdentities: batchId2.sourceScenes.map((value401) => value401.ref),
          sourceSceneCount: batchId2.sourceScenes.length,
        };
      !allowLocalBaselineFallback &&
        !enabled19 &&
        !batchId2.localFallbackReason &&
        requestCount >= callLimit &&
        (await handler13({
          stage: 'inventory',
          message:
            '本轮已完成 ' +
            requestCount +
            '/' +
            callLimit +
            ' 次分批调用；仍有清单批次待处理，系统将自动继续',
          remaining: {
            phase: 'inventory',
            sourceSceneCount:
              batchId2.sourceScenes.length +
              list117.reduce((value402, value403) => value402 + value403.sourceScenes.length, 0),
          },
        }));
      if (enabled19 || batchId2.localFallbackReason || requestCount >= callLimit) {
        await handler14(
          batchId2,
          batchId2.localFallbackReason || fallbackReason || '已达到本轮 ' + callLimit + ' 次请求上限',
        );
        continue;
      }
      let inventory3 = null;
      try {
        const value404 = await run7(
          {
            model: model2,
            provider: provider2,
            ...(providerProfileId2 ? { providerProfileId: providerProfileId2 } : {}),
            prompt: buildStoryAssetInventoryPrompt({
              project: project,
              sourceScenes: batchId2.sourceScenes,
            }),
            systemPrompt: STORY_ASSET_INVENTORY_SYSTEM_PROMPT,
            structuredOutput: createStoryAssetInventoryStructuredOutput(),
            temperature: 0.1,
            timeoutMs: STORY_ASSET_EXPERIMENTAL_REQUEST_TIMEOUT_MS,
            maxOutputTokens: STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
            allowOversizedPrompt: true,
          },
          value400,
        );
        try {
          const finishReason2 = normalizeText(
            getStoryAssetResponseFinishReason(value404) ||
              current2.batchSubmissionRecords[batchKey2]?.finishReason,
          ).toLowerCase();
          if (isStoryAssetResponseTruncated(finishReason2))
            throw Object.assign(new Error(message5 + '输出被截断。'), {
              type: 'OUTPUT_LENGTH',
              finishReason: finishReason2,
            });
          inventory3 = allowLocalBaselineFallback
            ? parseStoryAssetInventoryResultWithSalvage(value404, {
                sourceScenes: batchId2.sourceScenes,
              })
            : parseStoryAssetInventoryResult(value404, {
                sourceScenes:
                  JSON.parse(
                    current2.batchSubmissionRecords[batchKey2]?.contractSnapshot?.prompt || '{}',
                  ).sourceScenes || batchId2.sourceScenes,
              });
        } catch (value405) {
          await handler12(batchKey2, value400, value405);
        }
      } catch (value406) {
        if (
          ['ASSET_SUBMISSION_AMBIGUOUS', 'ASSET_PAID_RESULT_BLOCKED', 'ASSET_EXTRACTION_CONTINUE_REQUIRED'].includes(value406?.type)
        )
          throw value406;
        const error55 = classifyStoryAssetKindError(value406);
        ((enabled19 = true),
          (fallbackReason =
            getStoryAssetKindErrorLabel(error55.type, error55.message) + '，已熔断后续请求'),
          await handler14(batchId2, fallbackReason));
        continue;
      }
      (current2.inventoryBatches.push({
        id: batchId2.id,
        status: 'succeeded',
        sourceSceneRefs: batchId2.sourceScenes.map((value407) => value407.ref),
        salvaged: Boolean(inventory3.salvaged),
        inventory: inventory3,
      }),
        handler11(batchKey2),
        await run6({
          stage: 'inventory',
          message: message5 + '完成；本轮已调用 ' + requestCount + '/' + callLimit + ' 次',
        }));
    }
    const map48 = new Set(
        current2.inventoryBatches.flatMap((value408) => value408.sourceSceneRefs || []),
      ),
      list118 = sourceScenes9.map((value409) => value409.ref).filter(
        (value410) => !map48.has(value410),
      );
    if (list118.length) {
      const map49 = new Set(list118);
      await handler14(
        {
          id: 'inventory-missing-local-fallback',
          sourceScenes: sourceScenes9.filter((value411) => map49.has(value411.ref)),
        },
        '清单覆盖缺失，已使用本地确定性清单补齐',
      );
    }
  }
  if (!current2.inventory) {
    const storyAssetInventoryResults = mergeStoryAssetInventoryResults(
      current2.inventoryBatches.map((value412) => value412.inventory),
      { sourceScenes: sourceScenes9 },
    );
    current2.inventory = storyAssetInventoryResults;
  }
  current2.inventory = reconcileStoryAssetInventory(current2.inventory, {
    project: project,
    sourceScenes: sourceScenes9,
  });
  if (!allowLocalBaselineFallback) {
    const assetRefs = (current2.inventory?.assets || []).filter(
      (error56) => error56?.kind === 'scene' && /[/／|｜]/u.test(normalizeText(error56?.name)),
    );
    if (assetRefs.length) {
      (current2.failures.push({
        stage: 'inventory',
        batchId: 'inventory-scene-quality-gate',
        batchLabel: '场景原子化校验',
        errorType: 'composite-scene-assets',
        errorMessage: '仍有 ' + assetRefs.length + ' 个复合场景名',
        assetRefs: assetRefs.map((value413) => value413.ref),
      }),
        (current2.status = 'failed'),
        await run6({
          stage: 'inventory',
          message:
            '场景清单仍包含 ' + assetRefs.length + ' 个复合地点；已停止且不会把复合标题写入正式资产',
        }));
      throw createStoryAssetPipelineError(current2.failures);
    }
  }
  reportStoryAssetDiagnostics(diagnostics, 'story-asset-candidate-ledger', {
    status: 'completed',
    ...(current2.inventory?.candidateLedger?.summary || {}),
  });
  const issueCount = inspectStoryAssetInventoryCoverage(current2.inventory, sourceScenes9);
  issueCount.length
    ? ((current2.inventory.coverageWarnings = cloneStoryAssetExtractionValue(issueCount)),
      reportStoryAssetDiagnostics(diagnostics, 'story-asset-coverage-warning', {
        status: 'fallback',
        issueCount: issueCount.length,
        issueTypes: normalizeStringArray(issueCount.map((value414) => value414.type)),
      }))
    : delete current2.inventory.coverageWarnings;
  const list119 = createStoryAssetDetailPlans({
      inventory: current2.inventory,
      sourceScenes: sourceScenes9,
      chapterIds: storyContext3.chapterIds,
    }),
    map50 = new Map(list119.map((value415) => [value415.ref, value415]));
  ((current2.completedAssets = (
    Array.isArray(current2.completedAssets) ? current2.completedAssets : []
  )
    .filter(
      (value416) =>
        map50.has(value416?.ref) &&
        (allowLocalBaselineFallback || normalizeText(value416?.designStatus) !== 'baseline'),
    )
    .map((args45) => {
      const kind6 = map50.get(args45.ref),
        map51 = new Map(kind6.appearances.map((value417) => [value417.ref, value417])),
        prompt7 = (Array.isArray(args45?.appearances) ? args45.appearances : [])
          .filter((value418) => map51.has(value418?.ref))
          .map((args46) => {
            const name16 = map51.get(args46.ref);
            return {
              ...args46,
              name: name16.name,
              occurrences: name16.occurrences,
              sourceChapterIds: name16.sourceEpisodeRefs,
              sourceEpisodeRefs: name16.sourceEpisodeRefs,
              sourceSceneRefs: name16.sourceSceneRefs,
            };
          });
      return {
        ...args45,
        kind: kind6.kind,
        name: kind6.name,
        role: kind6.role,
        occurrences: kind6.occurrences,
        prompt: prompt7[0]?.prompt || args45.prompt || '',
        sourceChapterIds: kind6.sourceEpisodeRefs,
        sourceEpisodeRefs: kind6.sourceEpisodeRefs,
        sourceSceneRefs: kind6.sourceSceneRefs,
        appearances: prompt7,
      };
    })),
    (current2.detailBatches = Array.isArray(current2.detailBatches)
      ? current2.detailBatches
      : []));
  const map52 = new Set(
    current2.detailBatches
      .map((value419) => normalizeText(value419?.submissionBatchKey))
      .filter(Boolean),
  );
  (Object.entries(current2.batchSubmissionRecords).forEach(([submissionBatchKey, args47]) => {
    if (
      normalizeText(args47?.stage) !== 'detail' ||
      !normalizeText(args47?.rawResponse) ||
      map52.has(submissionBatchKey)
    )
      return;
    let list120 = [];
    try {
      const value420 = JSON.parse(args47?.contractSnapshot?.prompt || '{}');
      list120 = Array.isArray(value420?.assetPlans) ? value420.assetPlans : [];
    } catch {
      return;
    }
    const assetPlans3 = list120.map((value421) => map50.get(normalizeText(value421?.ref))).filter(Boolean),
      reconciledRemovedAssetRefs = list120.map((value422) => normalizeText(value422?.ref)).filter(
        (value423) => value423 && !map50.has(value423),
      );
    if (!assetPlans3.length || !reconciledRemovedAssetRefs.length) return;
    const completedAssetRefs = salvageStoryAssetDetailBatchResult(args47.rawResponse, {
        assetPlans: assetPlans3,
        chapterIds: storyContext3.chapterIds,
        visualStyle: visualStyle2,
      }),
      map53 = new Set(completedAssetRefs.map((value424) => value424.ref));
    if (!assetPlans3.every((value425) => map53.has(value425.ref))) return;
    ((current2.completedAssets = [
      ...current2.completedAssets.filter((value426) => !map53.has(value426.ref)),
      ...completedAssetRefs,
    ]),
      current2.detailBatches.push({
        id:
          normalizeText(args47?.batchId) ||
          'detail-recovered-' + (current2.detailBatches.length + 1),
        status: 'succeeded',
        assetRefs: assetPlans3.map((value427) => value427.ref),
        completedAssetRefs: completedAssetRefs.map((value428) => value428.ref),
        fallbackAssetRefs: [],
        recoveredFromSavedResponse: true,
        submissionBatchKey: submissionBatchKey,
        reconciledRemovedAssetRefs: reconciledRemovedAssetRefs,
      }),
      (current2.batchSubmissionRecords[submissionBatchKey] = {
        ...args47,
        status: 'validated',
        validatedAt: Date.now(),
        recoveredFromSavedResponse: true,
        reconciledRemovedAssetRefs: reconciledRemovedAssetRefs,
      }),
      map52.add(submissionBatchKey));
  }),
    current2.detailBatches.forEach((response13) => {
      const text29 = normalizeText(response13?.rawResponse);
      if (!text29 || response13?.status === 'succeeded') return;
      const assetPlans4 = normalizeStringArray(response13?.assetRefs)
        .map((value429) => map50.get(value429))
        .filter(Boolean);
      if (!assetPlans4.length) return;
      const list121 = salvageStoryAssetDetailBatchResult(text29, {
          assetPlans: assetPlans4,
          chapterIds: storyContext3.chapterIds,
          visualStyle: visualStyle2,
        }),
        map54 = new Set(list121.map((value430) => value430.ref)),
        list122 = allowLocalBaselineFallback
          ? createStoryAssetBaselineDetailAssets(
              assetPlans4.filter((value431) => !map54.has(value431.ref)),
              { sourceScenes: sourceScenes9, visualStyle: visualStyle2 },
            )
          : [],
        list123 = [...list121, ...list122];
      if (!list123.length) return;
      const map55 = new Set(list123.map((value432) => value432.ref));
      ((current2.completedAssets = [
        ...current2.completedAssets.filter((value433) => !map55.has(value433.ref)),
        ...list123,
      ]),
        (response13.completedAssetRefs = normalizeStringArray([
          ...(response13.completedAssetRefs || []),
          ...map55,
        ])),
        (response13.fallbackAssetRefs = normalizeStringArray([
          ...(response13.fallbackAssetRefs || []),
          ...list122.map((value434) => value434.ref),
        ])),
        (response13.status = assetPlans4.every((value435) => map55.has(value435.ref))
          ? 'succeeded'
          : 'partial'),
        (response13.recoveredFromSavedResponse = true));
      if (response13.status === 'succeeded') delete response13.rawResponse;
    }));
  const map56 = new Set(current2.completedAssets.map((value436) => value436.ref)),
    batchPlans = list119.filter((value437) => !map56.has(value437.ref));
  let assetCount2 = [],
    error57 = null;
  try {
    assetCount2 = createStoryAssetDetailPromptBatches(batchPlans, {
      project: project,
      sourceScenes: sourceScenes9,
      aspectRatio: aspectRatio,
      visualStyle: visualStyle2,
      estimateByKind: current2.outputEstimates,
    });
  } catch (value438) {
    error57 = value438;
  }
  const value439 = current2.detailBatches.length,
    handler15 = async ({
      batchPlans: batchPlans2,
      batchId: batchId3,
      fallbackReason: fallbackReason2,
      message: message6,
    }) => {
      if (!allowLocalBaselineFallback) {
        const errorMessage2 = normalizeText(fallbackReason2) || '资产视觉细化 API 请求不可用';
        (current2.detailBatches.push({
          id: batchId3,
          status: 'failed',
          assetRefs: batchPlans2.map((value440) => value440.ref),
          completedAssetRefs: [],
          fallbackAssetRefs: [],
          errorMessage: errorMessage2,
        }),
          current2.failures.push({
            stage: 'detail',
            batchId: batchId3,
            batchLabel: batchId3 + '（' + batchPlans2.length + ' 个资产）',
            errorType: 'incomplete-ai-detail',
            errorMessage: errorMessage2,
            assetRefs: batchPlans2.map((value441) => value441.ref),
          }),
          (current2.status = current2.completedAssets.length ? 'partial' : 'failed'),
          await run6({ stage: 'detail', message: message6 + '；已停止且不会生成本地假提示词' }));
        throw createStoryAssetPipelineError(current2.failures);
      }
      const completedAssetRefs2 = createStoryAssetBaselineDetailAssets(batchPlans2, {
          sourceScenes: sourceScenes9,
          visualStyle: visualStyle2,
        }),
        map57 = new Set(completedAssetRefs2.map((value442) => value442.ref));
      ((current2.completedAssets = [
        ...current2.completedAssets.filter((value443) => !map57.has(value443.ref)),
        ...completedAssetRefs2,
      ]),
        current2.detailBatches.push({
          id: batchId3,
          status: 'succeeded',
          assetRefs: batchPlans2.map((value444) => value444.ref),
          completedAssetRefs: completedAssetRefs2.map((value445) => value445.ref),
          fallbackAssetRefs: completedAssetRefs2.map((value446) => value446.ref),
          fallbackReason: fallbackReason2,
          circuitBreakerFallback: true,
        }),
        await run6({ stage: 'detail', message: message6 }));
    };
  batchPlans.length &&
    ((current2.phase = 'detail'),
    (current2.status = 'in-progress'),
    await run6({
      stage: 'detail',
      message:
        '正在按资产证据生成描述与图片提示词（已完成 ' + map56.size + '/' + list119.length + ' 个）',
    }));
  batchPlans.length &&
    error57 &&
    (await handler15({
      batchPlans: batchPlans,
      batchId: 'detail-' + (value439 + 1),
      fallbackReason: normalizeText(error57?.message) || '资产证据超过安全窗口',
      message:
        '资产证据超过安全窗口，已在本地生成 ' + batchPlans.length + ' 个基础设定，不会扩大请求',
    }));
  for (let batchIndex2 = 0; batchIndex2 < assetCount2.length; batchIndex2 += 1) {
    const contractIdentities = assetCount2[batchIndex2],
      batchId4 = 'detail-' + (value439 + batchIndex2 + 1),
      message7 = batchId4 + '（' + contractIdentities.length + ' 个资产）',
      batchKey3 = createStoryAssetBatchContractKey(
        'detail',
        contractIdentities.map(
          (error58) => error58.kind + ':' + error58.ref + ':' + error58.name,
        ),
      ),
      value447 = {
        stage: 'detail',
        batchId: batchId4,
        batchKey: batchKey3,
        kinds: normalizeStringArray(contractIdentities.map((value448) => value448.kind)),
        contractIdentities: contractIdentities.map(
          (error59) => error59.kind + ':' + error59.ref + ':' + error59.name,
        ),
        assetCount: contractIdentities.length,
        sourceSceneCount: selectStoryAssetDetailSourceScenes(contractIdentities, sourceScenes9).length,
      };
    !allowLocalBaselineFallback &&
      !enabled19 &&
      requestCount >= callLimit &&
      (await handler13({
        stage: 'detail',
        message:
          '本轮已完成 ' +
          requestCount +
          '/' +
          callLimit +
          ' 次分批调用；仍有提示词批次待处理，系统将自动继续',
        remaining: {
          phase: 'detail',
          assetCount: assetCount2.slice(batchIndex2).reduce(
            (value449, list124) => value449 + list124.length,
            0,
          ),
          batchCount: assetCount2.length - batchIndex2,
        },
      }));
    if (enabled19) {
      await handler15({
        batchPlans: contractIdentities,
        batchId: batchId4,
        fallbackReason: fallbackReason || '前序请求失败，熔断后未继续调用 API',
        message:
          message7 +
          '已跳过 API，使用本地基础设定补齐；已完成 ' +
          (current2.completedAssets.length + contractIdentities.length) +
          '/' +
          list119.length +
          ' 个资产',
      });
      continue;
    }
    let value450 = null;
    try {
      value450 = await run7(
        {
          model: model2,
          provider: provider2,
          ...(providerProfileId2 ? { providerProfileId: providerProfileId2 } : {}),
          prompt: buildStoryAssetDetailBatchPrompt({
            project: project,
            sourceScenes: sourceScenes9,
            batches: assetCount2,
            batchIndex: batchIndex2,
            aspectRatio: aspectRatio,
            visualStyle: visualStyle2,
          }),
          systemPrompt: STORY_ASSET_DETAIL_SYSTEM_PROMPT,
          structuredOutput: createStoryAssetDetailStructuredOutput(batchIndex2, contractIdentities),
          thinking: { type: 'disabled' },
          temperature: 0.2,
          timeoutMs: STORY_ASSET_EXPERIMENTAL_REQUEST_TIMEOUT_MS,
          maxOutputTokens: STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
        },
        value447,
      );
      const finishReason3 = normalizeText(
        getStoryAssetResponseFinishReason(value450) ||
          current2.batchSubmissionRecords[batchKey3]?.finishReason,
      ).toLowerCase();
      let completedAssetRefs3 = [],
        error60 = null;
      if (!allowLocalBaselineFallback)
        try {
          if (isStoryAssetResponseTruncated(finishReason3))
            throw Object.assign(new Error(message7 + '输出被截断。'), {
              type: 'OUTPUT_LENGTH',
              finishReason: finishReason3,
            });
          const value451 = JSON.parse(
            current2.batchSubmissionRecords[batchKey3]?.contractSnapshot?.prompt || '{}',
          );
          completedAssetRefs3 = parseStoryAssetDetailBatchResult(value450, {
            assetPlans: Array.isArray(value451?.assetPlans)
              ? value451.assetPlans
              : contractIdentities,
            chapterIds: storyContext3.chapterIds,
            visualStyle: visualStyle2,
          });
        } catch (value452) {
          await handler12(batchKey3, value447, value452);
        }
      else
        try {
          if (isStoryAssetResponseTruncated(finishReason3))
            throw Object.assign(new Error(message7 + '输出被截断。'), {
              type: 'OUTPUT_LENGTH',
              finishReason: finishReason3,
            });
          completedAssetRefs3 = parseStoryAssetDetailBatchResult(value450, {
            assetPlans: contractIdentities,
            chapterIds: storyContext3.chapterIds,
            visualStyle: visualStyle2,
          });
        } catch (value453) {
          ((error60 = value453),
            (completedAssetRefs3 = salvageStoryAssetDetailBatchResult(value450, {
              assetPlans: contractIdentities,
              chapterIds: storyContext3.chapterIds,
              visualStyle: visualStyle2,
            })));
        }
      const list125 = completedAssetRefs3,
        map58 = new Set(completedAssetRefs3.map((value454) => value454.ref)),
        fallbackAssetRefs = allowLocalBaselineFallback
          ? createStoryAssetBaselineDetailAssets(
              contractIdentities.filter((value455) => !map58.has(value455.ref)),
              { sourceScenes: sourceScenes9, visualStyle: visualStyle2 },
            )
          : [],
        status5 = Boolean(error60 || fallbackAssetRefs.length);
      completedAssetRefs3 = [...completedAssetRefs3, ...fallbackAssetRefs];
      if (completedAssetRefs3.length) {
        const map59 = new Set(completedAssetRefs3.map((value456) => value456.ref));
        ((current2.completedAssets = [
          ...current2.completedAssets.filter((value457) => !map59.has(value457.ref)),
          ...completedAssetRefs3,
        ]),
          (current2.outputEstimates = updateStoryAssetOutputEstimates(
            current2.outputEstimates,
            list125,
          )));
      }
      const map60 = new Set(completedAssetRefs3.map((value458) => value458.ref)),
        list126 = contractIdentities.filter((value459) => !map60.has(value459.ref)),
        value460 = list126.length > 0;
      (current2.detailBatches.push({
        id: batchId4,
        status: status5 || list126.length ? 'partial' : 'succeeded',
        assetRefs: contractIdentities.map((value461) => value461.ref),
        completedAssetRefs: completedAssetRefs3.map((value462) => value462.ref),
        fallbackAssetRefs: fallbackAssetRefs.map((value463) => value463.ref),
        ...(fallbackAssetRefs.length
          ? {
              fallbackReason:
                normalizeText(error60?.message) ||
                'AI 响应缺少 ' + fallbackAssetRefs.length + ' 个资产',
            }
          : {}),
        ...(value460 || status5
          ? { rawResponse: normalizeText(getResultText(value450)), finishReason: finishReason3 }
          : {}),
      }),
        handler11(batchKey3));
      status5 &&
        ((enabled19 = true),
        (fallbackReason =
          (normalizeText(error60?.message) ||
            'AI 响应缺少 ' + fallbackAssetRefs.length + ' 个资产') + '，已熔断后续细化请求'));
      if (status5 && !allowLocalBaselineFallback)
        throw (
          error60 ||
          new Error(
            message7 +
              '缺少 ' +
              (contractIdentities.length - list125.length) +
              ' 个完整 API 资产结果。',
          )
        );
      if (list126.length)
        throw error60 || new Error(message7 + '缺少 ' + list126.length + ' 个资产结果。');
      await run6({
        stage: 'detail',
        message: status5
          ? message7 +
            '响应不完整，已本地补齐并熔断后续 API；已完成 ' +
            current2.completedAssets.length +
            '/' +
            list119.length +
            ' 个资产'
          : message7 +
            '完成；已完成 ' +
            current2.completedAssets.length +
            '/' +
            list119.length +
            ' 个资产，本轮已调用 ' +
            requestCount +
            '/' +
            callLimit +
            ' 次',
      });
    } catch (value464) {
      if (
        ['ASSET_SUBMISSION_AMBIGUOUS', 'ASSET_PAID_RESULT_BLOCKED', 'ASSET_EXTRACTION_CONTINUE_REQUIRED'].includes(value464?.type)
      )
        throw value464;
      const errorType3 = classifyStoryAssetKindError(value464);
      if (value450 === null) {
        enabled19 = true;
        const storyAssetKindErrorLabel = getStoryAssetKindErrorLabel(
          errorType3.type,
          errorType3.message,
        );
        ((fallbackReason = storyAssetKindErrorLabel + '，已熔断后续细化请求'),
          await handler15({
            batchPlans: contractIdentities,
            batchId: batchId4,
            fallbackReason: fallbackReason,
            message:
              '' + message7 + storyAssetKindErrorLabel + '；本批改用本地基础设定，后续批次不再调用 API',
          }));
        continue;
      }
      (current2.failures.push({
        stage: 'detail',
        batchId: batchId4,
        batchLabel: message7,
        errorType: errorType3.type,
        errorMessage: errorType3.message,
        assetRefs: contractIdentities.map((value465) => value465.ref),
      }),
        (current2.status = current2.completedAssets.length ? 'partial' : 'failed'),
        await run6({
          stage: 'detail',
          message:
            '' +
            message7 +
            getStoryAssetKindErrorLabel(errorType3.type, errorType3.message) +
            '；已保存本批可解析结果，未自动重试',
        }));
      throw createStoryAssetPipelineError(current2.failures);
    }
  }
  if (!allowLocalBaselineFallback) {
    const map61 = new Set(
        current2.completedAssets
          .filter((value466) => normalizeText(value466?.designStatus) !== 'baseline')
          .map((value467) => value467.ref),
      ),
      assetRefs2 = list119.filter((value468) => !map61.has(value468.ref));
    if (assetRefs2.length) {
      (current2.failures.push({
        stage: 'detail',
        batchId: 'detail-quality-gate',
        batchLabel: 'API 视觉细化完整性校验',
        errorType: 'incomplete-ai-detail',
        errorMessage: '仍有 ' + assetRefs2.length + ' 个资产没有完整 API 视觉结果',
        assetRefs: assetRefs2.map((value469) => value469.ref),
      }),
        (current2.status = current2.completedAssets.length ? 'partial' : 'failed'),
        await run6({
          stage: 'detail',
          message:
            '仍有 ' +
            assetRefs2.length +
            ' 个资产没有完整 API 视觉结果；已停止且不会写入本地假提示词',
        }));
      throw createStoryAssetPipelineError(current2.failures);
    }
  }
  return (
    current2.completedAssets.sort(
      (value470, value471) =>
        list119.findIndex((value472) => value472.ref === value470.ref) -
        list119.findIndex((value473) => value473.ref === value471.ref),
    ),
    (current2.completedAssets = current2.completedAssets.map((value474) =>
      sanitizeStoryAssetPublicAsset(value474, { visualStyle: visualStyle2 }),
    )),
    (current2.phase = 'detail'),
    (current2.status = 'completed'),
    (current2.failures = []),
    await run6({
      stage: 'detail',
      message:
        '资产提取完成：' +
        current2.completedAssets.length +
        ' 个资产，本轮分批调用 ' +
        requestCount +
        ' 次；每个请求仅执行一次',
    }),
    {
      schemaVersion: STORY_ASSET_EXTRACTION_SCHEMA_VERSION,
      extractionStrategy: 'evidence-batched-api',
      assets: current2.completedAssets,
      candidateLedger: cloneStoryAssetExtractionValue(current2.inventory?.candidateLedger),
    }
  );
}
export async function extractStoryAssetsExperimental({
  project: project = {},
  episodes: episodes = [],
  model: model = '',
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  aspectRatio: aspectRatio = '',
  visualStyle: visualStyle = '',
  request: request = generateText,
  onProgress: onProgress = null,
  onCheckpoint: onCheckpoint = null,
  resumeDraft: resumeDraft = null,
  diagnostics: diagnostics = null,
} = {}) {
  request = withReplicationRequestPolicy(request, project);
  const model3 = normalizeText(model),
    provider3 = normalizeText(provider),
    providerProfileId3 = normalizeText(providerProfileId);
  if (!model3 || !provider3) throw new Error('请先选择可用的文本模型。');
  const storyContext4 = normalizeStoryContext(project),
    sourceScenes12 = normalizeStoryAssetExtractionSources(episodes),
    visualStyle3 = normalizeText(visualStyle) || storyContext4.visualStyle,
    sourceFingerprint3 = createStoryAssetExtractionFingerprint({
      storyContext: storyContext4,
      sourceScenes: sourceScenes12,
      model: model3,
      provider: provider3,
      providerProfileId: providerProfileId3,
      aspectRatio: aspectRatio,
      visualStyle: visualStyle3,
    }),
    sourceContentFingerprint3 = createStoryAssetExtractionContentFingerprint({
      storyContext: storyContext4,
      sourceScenes: sourceScenes12,
      aspectRatio: aspectRatio,
      visualStyle: visualStyle3,
    }),
    restoreStoryAssetPipelineDraft3 = restoreStoryAssetPipelineDraft(resumeDraft, {
      sourceFingerprint: sourceFingerprint3,
      sourceContentFingerprint: sourceContentFingerprint3,
    }),
    kindStates2 = Object.fromEntries(
      STORY_ASSET_EXPERIMENTAL_KINDS.map((kind7) => [
        kind7,
        {
          kind: kind7,
          status: 'pending',
          attempt: 0,
          assetCount: 0,
          errorType: '',
          errorMessage: '',
          startedAt: 0,
          finishedAt: 0,
        },
      ]),
    );
  let current4 = restoreStoryAssetPipelineDraft3 || {
    strategy: STORY_ASSET_EXTRACTION_DRAFT_STRATEGY,
    schemaVersion: STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION,
    sourceFingerprint: sourceFingerprint3,
    sourceContentFingerprint: sourceContentFingerprint3,
    status: 'pending',
    phase: 'kind',
    assetsByKind: Object.fromEntries(STORY_ASSET_EXPERIMENTAL_KINDS.map((value475) => [value475, []])),
    kindStates: kindStates2,
    completedKinds: [],
    completedAssets: [],
    failures: [],
    totalRequestCount: 0,
  };
  ((current4.strategy = STORY_ASSET_EXTRACTION_DRAFT_STRATEGY),
    (current4.schemaVersion = STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION),
    (current4.sourceFingerprint = sourceFingerprint3),
    (current4.sourceContentFingerprint = sourceContentFingerprint3),
    (current4.phase = 'kind'),
    (current4.assetsByKind =
      current4.assetsByKind && typeof current4.assetsByKind === 'object'
        ? current4.assetsByKind
        : {}),
    (current4.kindStates =
      current4.kindStates && typeof current4.kindStates === 'object' ? current4.kindStates : {}),
    STORY_ASSET_EXPERIMENTAL_KINDS.forEach((kind8) => {
      if (!Array.isArray(current4.assetsByKind[kind8])) current4.assetsByKind[kind8] = [];
      current4.kindStates[kind8] = {
        ...kindStates2[kind8],
        ...(current4.kindStates[kind8] || {}),
        kind: kind8,
      };
    }),
    (current4.completedKinds = STORY_ASSET_EXPERIMENTAL_KINDS.filter(
      (value476) => current4.kindStates[value476]?.status === 'succeeded',
    )),
    (current4.failures = []),
    (current4.runRequestCount = 0));
  let requestCount2 = 0;
  const run8 = async (message8 = '') => {
      ((current4.completedKinds = STORY_ASSET_EXPERIMENTAL_KINDS.filter(
        (value477) => current4.kindStates[value477]?.status === 'succeeded',
      )),
        current4.status !== 'completed' &&
          (current4.completedAssets = STORY_ASSET_EXPERIMENTAL_KINDS.flatMap(
            (value478) => current4.assetsByKind[value478] || [],
          )),
        (current4.progress = {
          stage: 'kind',
          current: current4.completedKinds.length,
          total: STORY_ASSET_EXPERIMENTAL_KINDS.length,
          message: message8,
          requestCount: requestCount2,
        }),
        (current4 = await saveStoryAssetExtractionCheckpoint(current4, onCheckpoint)),
        onProgress?.({
          stage: 'extracting-asset-kinds',
          current: current4.progress.current,
          total: current4.progress.total,
          message: message8,
        }));
    },
    handler16 = async (kind9) => {
      ((requestCount2 += 1),
        (current4.runRequestCount = requestCount2),
        (current4.totalRequestCount =
          Math.max(0, Number(current4.totalRequestCount) || 0) + 1));
      const promptCharacters = buildStoryAssetKindExtractionPrompt({
          project: project,
          sourceScenes: sourceScenes12,
          kind: kind9,
          aspectRatio: aspectRatio,
          visualStyle: visualStyle3,
        }),
        value479 = Date.now();
      reportStoryAssetDiagnostics(diagnostics, 'story-asset-request', {
        stage: 'kind',
        kind: kind9,
        status: 'started',
        requestCount: requestCount2,
        promptCharacters: promptCharacters.length,
        sourceSceneCount: sourceScenes12.length,
      });
      try {
        const request4 = await request({
            model: model3,
            provider: provider3,
            ...(providerProfileId3 ? { providerProfileId: providerProfileId3 } : {}),
            prompt: promptCharacters,
            systemPrompt: buildStoryAssetKindSystemPrompt(kind9),
            structuredOutput: createStoryAssetKindStructuredOutput(kind9),
            thinking: { type: 'disabled' },
            temperature: 0.1,
            timeoutMs: STORY_ASSET_EXPERIMENTAL_REQUEST_TIMEOUT_MS,
            maxOutputTokens: STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
            allowOversizedPrompt: true,
          }),
          finishReason4 = getStoryAssetResponseFinishReason(request4).toLowerCase();
        if (isStoryAssetResponseTruncated(finishReason4))
          throw Object.assign(new Error(STORY_ASSET_KIND_LABELS[kind9] + '输出被截断。'), {
            type: 'OUTPUT_LENGTH',
            finishReason: finishReason4,
          });
        return (
          reportStoryAssetDiagnostics(diagnostics, 'story-asset-request', {
            stage: 'kind',
            kind: kind9,
            status: 'succeeded',
            requestCount: requestCount2,
            elapsedMs: Math.max(0, Date.now() - value479),
            responseCharacters: normalizeText(getResultText(request4)).length,
          }),
          request4
        );
      } catch (value480) {
        const errorType4 = classifyStoryAssetKindError(value480);
        reportStoryAssetDiagnostics(diagnostics, 'story-asset-request', {
          stage: 'kind',
          kind: kind9,
          status: 'failed',
          requestCount: requestCount2,
          elapsedMs: Math.max(0, Date.now() - value479),
          errorType: errorType4.type,
          errorMessage: errorType4.message,
        });
        throw value480;
      }
    };
  ((current4.status = 'in-progress'),
    await run8(
      '正在按输出域提取资产（已完成 ' +
        current4.completedKinds.length +
        '/' +
        STORY_ASSET_EXPERIMENTAL_KINDS.length +
        '）',
    ));
  for (const kind10 of STORY_ASSET_EXPERIMENTAL_KINDS) {
    if (current4.kindStates[kind10]?.status === 'succeeded') continue;
    const startedAt = Date.now();
    ((current4.kindStates[kind10] = {
      ...current4.kindStates[kind10],
      kind: kind10,
      status: 'running',
      attempt:
        Math.max(0, Math.trunc(Number(current4.kindStates[kind10]?.attempt) || 0)) + 1,
      assetCount: 0,
      errorType: '',
      errorMessage: '',
      startedAt: startedAt,
      finishedAt: 0,
    }),
      await run8('正在提取' + STORY_ASSET_KIND_LABELS[kind10] + '；完整剧本输入保持不变'));
    try {
      const value481 = await handler16(kind10),
        assetCount3 = parseStoryAssetKindExtractionResult(value481, {
          kind: kind10,
          sourceScenes: sourceScenes12,
          chapterIds: storyContext4.chapterIds,
          visualStyle: visualStyle3,
        });
      ((current4.assetsByKind[kind10] = assetCount3.assets),
        (current4.kindStates[kind10] = {
          ...current4.kindStates[kind10],
          status: 'succeeded',
          assetCount: assetCount3.assets.length,
          errorType: '',
          errorMessage: '',
          finishedAt: Date.now(),
        }),
        await run8(STORY_ASSET_KIND_LABELS[kind10] + '完成：' + assetCount3.assets.length + ' 个'));
    } catch (value482) {
      const errorType5 = classifyStoryAssetKindError(value482);
      ((current4.kindStates[kind10] = {
        ...current4.kindStates[kind10],
        status: 'failed',
        assetCount: 0,
        errorType: errorType5.type,
        errorMessage: errorType5.message,
        finishedAt: Date.now(),
      }),
        (current4.failures = [
          {
            stage: 'kind',
            kind: kind10,
            errorType: errorType5.type,
            errorMessage: errorType5.message,
          },
        ]),
        (current4.status = current4.completedKinds.length ? 'partial' : 'failed'),
        await run8(
          '' +
            STORY_ASSET_KIND_LABELS[kind10] +
            getStoryAssetKindErrorLabel(errorType5.type, errorType5.message) +
            '；未自动重试',
        ));
      throw createStoryAssetPipelineError(current4.failures);
    }
  }
  const list127 = normalizeStringArray(sourceScenes12.flatMap((value483) => value483.characters || [])),
    assets11 = STORY_ASSET_EXPERIMENTAL_KINDS.flatMap(
      (value484) => current4.assetsByKind[value484] || [],
    )
      .map((error61) => {
        const list128 = normalizeStringArray(error61?.sourceSceneRefs),
          sourceSceneRefs13 = list128.length
            ? list128
            : inferStoryAssetSourceSceneRefs(error61?.kind, error61?.name, sourceScenes12);
        return { ...error61, sourceSceneRefs: sourceSceneRefs13 };
      })
      .filter(
        (error62) =>
          normalizeStringArray(error62?.sourceSceneRefs).length > 0 &&
          !(
            error62?.kind === 'prop' &&
            list127.some((value485) => storyCharacterNamesOverlap(error62?.name, value485))
          ),
      ),
    inventory4 = reconcileStoryAssetInventory(
      parseStoryAssetInventoryResult(
        {
          assets: assets11.map((ref24) => ({
            ref: ref24.ref,
            kind: ref24.kind,
            name: ref24.name,
            role: ref24.role,
            description: ref24.description,
            sourceSceneRefs: ref24.sourceSceneRefs,
            appearances: (ref24.appearances || []).map((ref25) => ({
              ref: ref25.ref,
              name: ref25.name,
              description: ref25.description,
              sourceSceneRefs: ref25.sourceSceneRefs,
            })),
          })),
          sceneAudits: sourceScenes12.map((sourceSceneRef9) => ({
            sourceSceneRef: sourceSceneRef9.ref,
            keyPropNames: assets11.filter(
              (value486) =>
                value486.kind === 'prop' &&
                value486.sourceSceneRefs.includes(sourceSceneRef9.ref),
            ).map((error63) => error63.name),
          })),
        },
        { sourceScenes: sourceScenes12 },
      ),
      { project: project, sourceScenes: sourceScenes12 },
    ),
    list129 = inspectStoryAssetInventoryCoverage(inventory4, sourceScenes12);
  if (list129.length) throw createCoverageError(list129);
  return (
    (current4.inventory = inventory4),
    (current4.completedAssets = finalizeStoryAssetInventoryAssets({
      inventory: inventory4,
      sourceScenes: sourceScenes12,
      chapterIds: storyContext4.chapterIds,
      visualStyle: visualStyle3,
    })),
    (current4.status = 'completed'),
    (current4.failures = []),
    await run8(
      '资产提取完成：' +
        current4.completedAssets.length +
        ' 个资产；模型只返回精简清单，基础提示词已在本地生成',
    ),
    {
      schemaVersion: STORY_ASSET_EXTRACTION_SCHEMA_VERSION,
      extractionStrategy: 'kind-compact',
      assets: current4.completedAssets,
    }
  );
}
