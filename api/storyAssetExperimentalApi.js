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
export const STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION = 0x7;
export const STORY_ASSET_INVENTORY_PROMPT_TARGET_CHARACTERS = 0x4e20;
export const STORY_ASSET_INVENTORY_REPAIR_REQUEST_LIMIT = 0x1;
export const STORY_ASSET_INVENTORY_MAX_SOURCE_SCENES = 0x32;
export const STORY_ASSET_KIND_BATCH_MAX_SOURCE_SCENES = 0x1e;
export const STORY_ASSET_AUTOMATIC_CALL_LIMIT = 0x3;
export const STORY_ASSET_BATCH_REQUEST_LIMIT = 0x10;
export const STORY_ASSET_EXPERIMENTAL_REQUEST_TIMEOUT_MS = 0x3 * 0x3c * 0x3e8;
export const STORY_ASSET_SOURCE_WINDOW_TARGET_CHARACTERS = 0xc350;
export const STORY_ASSET_DETAIL_TARGET_OUTPUT_CHARACTERS = 0x3e80;
export const STORY_ASSET_DETAIL_MAX_OUTPUT_CHARACTERS = 0x55f0;
export const STORY_ASSET_DETAIL_MAX_ASSETS_PER_BATCH = 0xc;
export const STORY_ASSET_DETAIL_PROMPT_TARGET_CHARACTERS = 0x4650;
export const STORY_ASSET_EXPERIMENTAL_KINDS = Object['freeze'](['character', 'scene', 'prop']);
const STORY_ASSET_DETAIL_SOURCE_BODY_MAX_CHARACTERS = 0x4b0,
  STORY_ASSET_DETAIL_SOURCE_SCENE_MAX_COUNT = 0xf,
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
  ]['join']('\x0a'),
  STORY_ASSET_INVENTORY_REPAIR_SYSTEM_PROMPT = [
    '你是影视资产清单修复 Agent。',
    '只处理输入 coverageIssues 指出的缺失、重复或来源映射错误，不重新规划未报错资产。',
    'upserts 返回需要新增或完整替换的轻量资产；removeAssetRefs 只返回确实需要删除的旧资产 ref。',
    '不得生成声音设定、图片提示词或长篇视觉描述。',
    '只返回严格 JSON，不要输出 Markdown、注释或说明。',
  ]['join']('\x0a'),
  STORY_ASSET_DETAIL_SYSTEM_PROMPT = [
    '你是专业的影视资产设定 Agent。',
    '当前只细化输入 assetPlans，不新增、删除、合并或重排资产与形象。',
    '每个资产都提供独立\x20evidenceDossiers；scriptFacts\x20只能记录原文证据或已确认项目设定直接支持的事实，不得把推测写成剧情事实。',
    'visualDesign\x20用于记录生成形象所需但原文没有明确提供的视觉补全；补全必须符合身份、时代、世界观和视觉风格，并且不得与\x20scriptFacts\x20冲突。',
    'description 必须明确分成“剧本事实”和“视觉补全”两部分，禁止用视觉补全反向改写人物身份、关系、道具归属或剧情状态。',
    STORY_ASSET_VOICE_DESCRIPTION_RULE,
    '角色图片提示词只用于独立人设图：具体描述脸部、发型、体态、服装、鞋履和必要穿戴细节，采用自然站立的正面全身人物设定图，不写剧情道具、动作表演、地点、家具、其他人物或剧情场面。',
    '最终 prompt 只能写需要呈现的正向视觉内容，不得复述任何规则、限制、处理流程、模型说明或其他元说明措辞。',
    '场景图片提示词必须描述空间布局、结构材质、前中后景、关键陈设、光源色温、时间天气、色彩、视角和景别，并默认无人。',
    '道具图片提示词必须描述用途、轮廓、尺寸、材质工艺、颜色纹样、磨损和关键结构，采用产品设定构图并默认无人手持。',
    '多形象角色必须在每个形象中完整复述稳定的脸部、发型和体态特征，只改变剧情明确要求的外观差异。',
    '只依据输入 sourceScenes 细化，不续写剧情，不创建分集或分镜。',
    '只返回严格 JSON，不要输出 Markdown、注释或说明。',
  ]['join']('\x0a');
function normalizeText(_0x2c8874) {
  return typeof _0x2c8874 === 'string' ? _0x2c8874['trim']() : '';
}
function normalizeStringArray(_0x439a4f) {
  return [
    ...new Set((Array['isArray'](_0x439a4f) ? _0x439a4f : [])['map'](normalizeText)['filter'](Boolean)),
  ];
}
function normalizeReference(_0x4199b9, _0x57064b = '') {
  return normalizeText(_0x4199b9)['replace'](/\s+/g, '-') || _0x57064b;
}
function getResultText(_0x215b22) {
  if (typeof _0x215b22 === 'string') return _0x215b22;
  return _0x215b22?.['text'] || _0x215b22?.['outputText'] || _0x215b22?.['content'] || _0x215b22 || '';
}
async function requestStrictAgentResult({
  request: _0x61c293,
  requestPayload: _0x27cec2,
  parse: _0x57e584,
  outputContract: _0x3d5ed0,
  maxAttempts: maxAttempts = 0x2,
}) {
  let _0x16ccab = await _0x61c293(_0x27cec2);
  for (let _0x3f59a3 = 0x1; _0x3f59a3 <= maxAttempts; _0x3f59a3 += 0x1) {
    try {
      return _0x57e584(_0x16ccab);
    } catch (_0x390beb) {
      if (_0x3f59a3 >= maxAttempts) throw _0x390beb;
      _0x16ccab = await _0x61c293({
        ..._0x27cec2,
        temperature: 0.1,
        prompt: JSON['stringify']({
          task: 'repair_invalid_agent_response',
          originalRequest: JSON['parse'](_0x27cec2['prompt']),
          rejectionReason: normalizeText(_0x390beb?.['message'] || _0x390beb),
          rejectedResponse: normalizeText(getResultText(_0x16ccab)),
          instruction: '重新执行原任务，只返回符合要求的严格 JSON 对象。',
          outputContract: _0x3d5ed0,
        }),
      });
    }
  }
  throw new Error('Agent 返回结果校验失败。');
}
function normalizeStoryContext(_0xf7829c = {}) {
  const _0x1562ae = Array['isArray'](_0xf7829c?.['chapters'])
      ? _0xf7829c['chapters']['map']((_0x5539ab, _0x58fc28) => ({
          id: normalizeText(_0x5539ab?.['id']) || 'chapter-' + (_0x58fc28 + 0x1),
          title: normalizeText(_0x5539ab?.['title']),
        }))
      : [],
    _0x5c522c = {
      title: normalizeText(_0xf7829c?.['title']),
      storyType: normalizeText(_0xf7829c?.['storyType']),
      summary: normalizeText(_0xf7829c?.['summary'] || _0xf7829c?.['storySummary']),
      background: normalizeText(_0xf7829c?.['background'] || _0xf7829c?.['storyBackground']),
      setting: normalizeText(_0xf7829c?.['setting'] || _0xf7829c?.['storySetting']),
      logline: normalizeText(_0xf7829c?.['logline']),
      continuityFacts: normalizeStringArray([
        ...(Array['isArray'](_0xf7829c?.['continuityFacts']) ? _0xf7829c['continuityFacts'] : []),
        ...(Array['isArray'](_0xf7829c?.['storyFacts']) ? _0xf7829c['storyFacts'] : []),
      ])['slice'](0x0, 0x14),
      characters: (Array['isArray'](_0xf7829c?.['characters']) ? _0xf7829c['characters'] : [])
        ['map']((_0x266458) => ({
          ref: normalizeText(_0x266458?.['ref']),
          name: normalizeText(_0x266458?.['name']),
          roleType: normalizeText(_0x266458?.['roleType'] || _0x266458?.['role']),
          fixedTraits: normalizeText(_0x266458?.['fixedTraits']),
          profile: normalizeText(_0x266458?.['profile']),
        }))
        ['filter']((_0x3e48f3) => _0x3e48f3['name'])
        ['slice'](0x0, 0xc),
      scriptMode: normalizeText(_0xf7829c?.['scriptMode']) || 'plot',
      aspectRatio: normalizeText(_0xf7829c?.['aspectRatio']) || '16:9',
      visualStyle: normalizeText(
        _0xf7829c?.['videoStylePrompt'] || _0xf7829c?.['visualStyle'] || _0xf7829c?.['videoStyle'],
      ),
      chapterIds: _0x1562ae['map']((_0x5f5605) => _0x5f5605['id']),
    };
  if (!_0x5c522c['title'] || !_0x5c522c['chapterIds']['length'])
    throw new Error('请先完成并确认全部分集剧本。');
  return _0x5c522c;
}
function normalizeSourceCharacters(_0x612de4) {
  return normalizeStringArray(_0x612de4)['filter'](
    (_0xfc6f06) => !/^(?:旁白|画外音|VO|OS)$/iu['test'](_0xfc6f06),
  );
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
function normalizeSourceCharacterName(_0x568bd8) {
  const _0x401253 = normalizeText(_0x568bd8)
    ['replace'](/^[【\[]|[】\]]$/gu, '')
    ['replace'](/[（(][^（）()\r\n]{0,30}[）)]\s*$/u, '')
    ['replace'](/^(?:演员|饰演)\s*[:：]\s*/u, '')
    ['trim']();
  if (!_0x401253 || [..._0x401253]['length'] > 0xc) return '';
  if (STORY_SOURCE_NON_CHARACTER_LABELS['has'](_0x401253['toLowerCase']())) return '';
  if (STORY_SOURCE_NONVISUAL_SPEAKER_PATTERN['test'](_0x401253)) return '';
  if (/(?:旁白|画外音|字幕|音效|音乐)$/u['test'](_0x401253)) return '';
  if (/^(?:第?\d+[场幕镜]|场次|章节|日|夜|白天|黑夜)$/u['test'](_0x401253)) return '';
  if (/^(?:然后|随后|接着|紧接着|这时|此时)(?:他|她|它)?/u['test'](_0x401253)) return '';
  if (/^(?:若干|数名|多名)|(?:若干|数人|多人|等人)$/u['test'](_0x401253)) return '';
  if (STORY_SOURCE_ANONYMOUS_GROUP_PATTERN['test'](_0x401253)) return '';
  if (!/^[\p{Script=Han}A-Za-z0-9·•._-]+$/u['test'](_0x401253)) return '';
  return _0x401253;
}
function normalizeDeterministicStoryCharacterCandidate(_0xda94b7) {
  const _0x520776 = normalizeSourceCharacterName(_0xda94b7)['replace'](
      /(?:及|与)(?:其)?(?:弟子|随从|众人|同伴)$/u,
      '',
    ),
    _0x27ecce = [..._0x520776]['length'];
  if (!_0x520776 || _0x27ecce < 0x2 || _0x27ecce > 0x8) return '';
  if (/^无(?:相应)?实体$/u['test'](_0x520776)) return '';
  if (/^第[一二三四五六七八九十百千万\d]+(?:道|次|个|名|位|集|章|场|幕|镜)$/u['test'](_0x520776)) return '';
  if (/^(?:他|她|它|他们|她们|它们|众人|人群|观众|子殿下)$/u['test'](_0x520776)) return '';
  if (/(?:若干|数人|多人|[一二三四五六七八九十\d]+人)$/u['test'](_0x520776)) return '';
  if (STORY_SOURCE_ANONYMOUS_GROUP_PATTERN['test'](_0x520776)) return '';
  if (/^(?:只想|该是|才能|如果|因为|为了|已经|这个|那个)/u['test'](_0x520776)) return '';
  if (/(?:说话|曲子|意赅|怎样的奇女子)$/u['test'](_0x520776)) return '';
  return _0x520776;
}
function getDeterministicStoryCharacterCandidates(_0x574c1c = {}) {
  return normalizeStringArray(
    normalizeStringArray(_0x574c1c?.['characters'])['map'](normalizeDeterministicStoryCharacterCandidate),
  );
}
function getStoryAssetNameAliases(_0x37d1b6) {
  const _0x32c462 = normalizeText(_0x37d1b6);
  if (!_0x32c462) return [];
  const _0x5602eb = [..._0x32c462['matchAll'](/[（(]([^（）()\r\n]+)[）)]/gu)]['map']((_0x379d26) =>
      normalizeText(_0x379d26[0x1]),
    ),
    _0x4f92b3 = normalizeText(_0x32c462['replace'](/[（(][^（）()\r\n]+[）)]/gu, ''));
  return normalizeStringArray(
    [_0x32c462, _0x4f92b3, ..._0x5602eb]['flatMap']((_0x3cdfeb) => [
      _0x3cdfeb,
      normalizeSourceCharacterName(_0x3cdfeb),
    ]),
  );
}
function storyCharacterNamesOverlap(_0x17c8b4, _0x2cf0bb) {
  const _0x507355 = new Set(
    getStoryAssetNameAliases(_0x2cf0bb)['map']((_0xd72824) => _0xd72824['toLowerCase']()),
  );
  return getStoryAssetNameAliases(_0x17c8b4)['some']((_0x4f127c) =>
    _0x507355['has'](_0x4f127c['toLowerCase']()),
  );
}
function storyCharacterNamesStronglyOverlap(_0x53d351, _0x14dada) {
  if (storyCharacterNamesOverlap(_0x53d351, _0x14dada)) return !![];
  const _0x2bfd3e = normalizeDeterministicStoryCharacterCandidate(_0x53d351)['toLowerCase'](),
    _0x3140de = normalizeDeterministicStoryCharacterCandidate(_0x14dada)['toLowerCase']();
  if (!_0x2bfd3e || !_0x3140de) return ![];
  if (/[a-z0-9]/u['test'](_0x2bfd3e) || /[a-z0-9]/u['test'](_0x3140de)) return ![];
  const [_0x4dc28b, _0x53b22d] =
    _0x2bfd3e['length'] <= _0x3140de['length'] ? [_0x2bfd3e, _0x3140de] : [_0x3140de, _0x2bfd3e];
  return (
    [..._0x4dc28b]['length'] >= 0x2 &&
    [..._0x53b22d]['length'] - [..._0x4dc28b]['length'] <= 0x3 &&
    _0x53b22d['includes'](_0x4dc28b)
  );
}
function addDeterministicStoryCharacterCandidate(_0x28b882, _0x5baeda, _0x488d71) {
  const _0x24f93a = [..._0x28b882['entries']()]['find'](
    ([_0x3eceb0, _0x45ca49]) =>
      storyCharacterNamesStronglyOverlap(_0x3eceb0, _0x5baeda) ||
      (_0x45ca49?.['aliases'] || [])['some']((_0x2620c2) =>
        storyCharacterNamesStronglyOverlap(_0x2620c2, _0x5baeda),
      ),
  );
  if (_0x24f93a) {
    const [_0x2a24bc, _0x19bc38] = _0x24f93a;
    (_0x19bc38['sourceSceneRefs']['push'](_0x488d71),
      (_0x19bc38['aliases'] = normalizeStringArray([..._0x19bc38['aliases'], _0x5baeda])),
      _0x28b882['set'](_0x2a24bc, _0x19bc38));
    return;
  }
  _0x28b882['set'](_0x5baeda, { aliases: [_0x5baeda], sourceSceneRefs: [_0x488d71] });
}
function createDeterministicStoryCharacterCandidateMap(_0x3353c5 = []) {
  const _0x5dfa24 = new Map();
  return (
    _0x3353c5['forEach']((_0x54571f) => {
      getDeterministicStoryCharacterCandidates(_0x54571f)['forEach']((_0x106954) => {
        addDeterministicStoryCharacterCandidate(_0x5dfa24, _0x106954, _0x54571f['ref']);
      });
    }),
    _0x5dfa24
  );
}
function resolveDeterministicStoryCharacterCanonicalName(_0x2a1490, _0x13477c) {
  const _0x5ae087 = normalizeDeterministicStoryCharacterCandidate(_0x2a1490);
  if (!_0x5ae087) return '';
  const _0x5a22a1 = [..._0x13477c['entries']()]['find'](
    ([_0x308bd2, _0x280496]) =>
      storyCharacterNamesStronglyOverlap(_0x308bd2, _0x5ae087) ||
      (_0x280496?.['aliases'] || [])['some']((_0x280df8) =>
        storyCharacterNamesStronglyOverlap(_0x280df8, _0x5ae087),
      ),
  );
  return _0x5a22a1?.[0x0] || _0x5ae087;
}
const STORY_CHARACTER_TRAILING_ACTION_PATTERN =
  /^(?:(?:正|又|还|便|只|连忙|忙)?(?:附耳|噘着嘴|不死心|安抚|劝说|劝道|说道|问道|答道|喊道|笑道|哭道|皱眉|点头|摇头|转身|抬手|挥手|走向|看向|望着|盯着|站起|坐下|推开|握住|拿起|放下|冷笑|苦笑|大喊).*)$/u;
function getStoryAssetLocalCharacterCanonicalNames(_0x53dc65 = []) {
  return normalizeStringArray(
    _0x53dc65['flatMap']((_0x3b4201) => [
      ...normalizeStringArray(_0x3b4201?.['localEntityCandidates']?.['character']),
      ...(Array['isArray'](_0x3b4201?.['localEntityEvidence'])
        ? _0x3b4201['localEntityEvidence']
            ['filter']((_0x366a78) => _0x366a78?.['kind'] === 'character')
            ['map']((_0xdb42b3) => _0xdb42b3?.['text'])
        : []),
    ])
      ['map'](normalizeDeterministicStoryCharacterCandidate)
      ['filter'](Boolean),
  );
}
function resolveStoryAssetCharacterCanonicalName(_0x27bbe9, _0x17a086, _0x1fffe2 = []) {
  const _0x3929b0 = normalizeDeterministicStoryCharacterCandidate(_0x27bbe9);
  if (!_0x3929b0) return '';
  const _0x1701fa = _0x1fffe2['filter'](
    (_0x2479dc) =>
      _0x2479dc !== _0x3929b0 &&
      _0x3929b0['startsWith'](_0x2479dc) &&
      STORY_CHARACTER_TRAILING_ACTION_PATTERN['test'](_0x3929b0['slice'](_0x2479dc['length'])),
  )['sort']((_0x483ca4, _0x31af9b) => [..._0x31af9b]['length'] - [..._0x483ca4]['length'])[0x0];
  return _0x1701fa || resolveDeterministicStoryCharacterCanonicalName(_0x3929b0, _0x17a086);
}
function resolveStoryProjectCharacterCanonicalName(_0x1b90ac, _0x5ce0c7 = []) {
  return _0x5ce0c7['find']((_0x3cb2de) => storyCharacterNamesOverlap(_0x3cb2de, _0x1b90ac)) || '';
}
function extractStorySourceCastNames(_0x2d26cb = '') {
  const _0x3dc1de = [],
    _0x7a7aa0 = normalizeText(_0x2d26cb),
    _0x3ee0b3 = /(?:出场人物|登场人物|出场角色)\s*[:：]\s*([^\r\n]+)/gu;
  let _0x54842a = _0x3ee0b3['exec'](_0x7a7aa0);
  while (_0x54842a) {
    const _0x39d248 = _0x54842a[0x1]
      ['replace'](/[（(][^（）()\r\n]{0,30}[）)]/gu, '')
      ['split'](/\s{2,}|[；;。]/u)[0x0];
    (_0x39d248['split'](/[、,，/／|]/u)['forEach']((_0x115ad6) => {
      const _0x1c95b7 = normalizeSourceCharacterName(_0x115ad6);
      if (_0x1c95b7) _0x3dc1de['push'](_0x1c95b7);
    }),
      (_0x54842a = _0x3ee0b3['exec'](_0x7a7aa0)));
  }
  return normalizeStringArray(_0x3dc1de);
}
function isLikelyStorySourceDialogueSpeaker(_0x673fdc, _0x33d715 = []) {
  if (!_0x673fdc) return ![];
  if (_0x33d715['includes'](_0x673fdc)) return !![];
  if (_0x33d715['some']((_0x18f1f0) => _0x673fdc['startsWith'](_0x18f1f0))) return ![];
  if ([..._0x673fdc]['length'] > 0x6) return ![];
  if (/^(?:他|她|它|他们|她们|它们|众人|人群|观众|评论区|弹幕)/u['test'](_0x673fdc)) return ![];
  if (/^(?:然后|随后|接着|紧接着|这时|此时)(?:他|她|它)?/u['test'](_0x673fdc)) return ![];
  if (/(?:若干|数人|多人|等人)$/u['test'](_0x673fdc)) return ![];
  return !/(?:面无表情|面不改色|一把|抓住|咳着|喊出声|已经|炸了|冷笑|苦笑|说道|问道|答道|开口|皱眉|点头|摇头|转身|抬手|挥手|走向|看向|望着|盯着|站起|坐下|推开|握住|拿起|放下)$/u[
    'test'
  ](_0x673fdc);
}
function normalizeStorySourceDialogueSpeaker(_0x1e5aa4) {
  const _0x2f1af4 = normalizeSourceCharacterName(_0x1e5aa4)
    ['replace'](STORY_SOURCE_DIALOGUE_ACTION_SUFFIX_PATTERN, '')
    ['trim']();
  if (!_0x2f1af4 || STORY_SOURCE_NONVISUAL_SPEAKER_PATTERN['test'](_0x2f1af4)) return '';
  return _0x2f1af4;
}
function isDeclaredStorySourceSpeakerAlias(_0x20dd17, _0x451cd1 = []) {
  const _0x494b9a = normalizeText(_0x20dd17);
  if (!_0x494b9a) return ![];
  return _0x451cd1['some'](
    (_0x295029) =>
      storyCharacterNamesOverlap(_0x295029, _0x494b9a) ||
      ([..._0x494b9a]['length'] >= 0x2 && normalizeText(_0x295029)['endsWith'](_0x494b9a)),
  );
}
function extractStorySourceDialogueSpeakers(_0x21c16c = '', _0x3fbf2f = []) {
  const _0x3411f3 = [];
  return (
    normalizeText(_0x21c16c)
      ['split'](/\r?\n/u)
      ['forEach']((_0x12bce5) => {
        const _0x3b88b5 = _0x12bce5['match'](
            /^[\s>*#-]*(?:【)?([\p{Script=Han}A-Za-z0-9·•._-]{1,12})(?:】)?(?:[（(][^（）()\r\n]{0,30}[）)])?(?:\*\*)?\s*[:：]/u,
          ),
          _0x26f928 = normalizeStorySourceDialogueSpeaker(_0x3b88b5?.[0x1]);
        isLikelyStorySourceDialogueSpeaker(_0x26f928, _0x3fbf2f) &&
          !isDeclaredStorySourceSpeakerAlias(_0x26f928, _0x3fbf2f) &&
          _0x3411f3['push'](_0x26f928);
      }),
    normalizeStringArray(_0x3411f3)
  );
}
export function extractStorySourceCharacterNames({ characters: characters = [], body: body = '' } = {}) {
  const _0x49b458 = normalizeSourceCharacters([
    ...normalizeStringArray(characters)['map'](normalizeSourceCharacterName)['filter'](Boolean),
    ...extractStorySourceCastNames(body),
  ]);
  return normalizeSourceCharacters([..._0x49b458, ...extractStorySourceDialogueSpeakers(body, _0x49b458)]);
}
export function normalizeStoryAssetExtractionSources(_0x17db03 = []) {
  const _0x3e3312 = [];
  (Array['isArray'](_0x17db03) ? _0x17db03 : [])['forEach']((_0x1446ef, _0x51295e) => {
    const _0x2daaec = normalizeReference(
        _0x1446ef?.['id'] || _0x1446ef?.['ref'] || _0x1446ef?.['planningRef'],
        'episode-' + (_0x51295e + 0x1),
      ),
      _0x5a5663 = Math['max'](0x1, Math['trunc'](Number(_0x1446ef?.['number']) || _0x51295e + 0x1));
    (Array['isArray'](_0x1446ef?.['script']?.['scenes']) ? _0x1446ef['script']['scenes'] : [])['forEach'](
      (_0x2c1172, _0x343723) => {
        const _0x24950d = normalizeText(_0x2c1172?.['heading']),
          _0x3d65ef = normalizeText(_0x2c1172?.['body']);
        if (!_0x24950d || !_0x3d65ef) return;
        const _0x454e43 = normalizeReference(_0x2c1172?.['ref'], _0x2daaec + '-scene-' + (_0x343723 + 0x1)),
          _0x507e2b = extractStorySourceCharacterNames({
            characters: _0x2c1172?.['characters'],
            body: _0x3d65ef,
          });
        _0x3e3312['push']({
          episodeRef: _0x2daaec,
          episodeNumber: _0x5a5663,
          localRef: _0x454e43,
          heading: _0x24950d,
          assetHeading: _0x24950d,
          source: normalizeText(_0x2c1172?.['source']),
          isSourceWindow: ![],
          characters: _0x507e2b,
          body: _0x3d65ef,
        });
      },
    );
  });
  const _0x424cff = _0x3e3312['reduce']((_0x2cceba, _0x1fe36d) => {
      return (
        _0x2cceba['set'](_0x1fe36d['localRef'], (_0x2cceba['get'](_0x1fe36d['localRef']) || 0x0) + 0x1),
        _0x2cceba
      );
    }, new Map()),
    _0x260958 = _0x3e3312['map']((_0x1765c5) => ({
      ref:
        _0x424cff['get'](_0x1765c5['localRef']) > 0x1
          ? _0x1765c5['episodeRef'] + ':' + _0x1765c5['localRef']
          : _0x1765c5['localRef'],
      episodeRef: _0x1765c5['episodeRef'],
      episodeNumber: _0x1765c5['episodeNumber'],
      heading: _0x1765c5['heading'],
      assetHeading: _0x1765c5['assetHeading'] || _0x1765c5['heading'],
      source: _0x1765c5['source'],
      isSourceWindow: Boolean(_0x1765c5['isSourceWindow']),
      characters: _0x1765c5['characters'],
      body: _0x1765c5['body'],
    }));
  if (!_0x260958['length']) throw new Error('资产提取没有找到可用的分集场次正文。');
  return _0x260958;
}
export function createStoryAssetKindSourceBatches(
  _0xdfa7bb = [],
  { maxSourceScenes: maxSourceScenes = STORY_ASSET_KIND_BATCH_MAX_SOURCE_SCENES } = {},
) {
  const _0x12c24a = Math['max'](0x1, Math['trunc'](Number(maxSourceScenes) || 0x0)),
    _0x12f9db = [];
  (Array['isArray'](_0xdfa7bb) ? _0xdfa7bb : [])['forEach']((_0x48a5cd) => {
    const _0x113f44 = normalizeText(_0x48a5cd?.['episodeRef']) || 'unknown-episode',
      _0x7d48f3 = _0x12f9db['at'](-0x1);
    if (!_0x7d48f3 || _0x7d48f3['episodeRef'] !== _0x113f44) {
      _0x12f9db['push']({ episodeRef: _0x113f44, scenes: [_0x48a5cd] });
      return;
    }
    _0x7d48f3['scenes']['push'](_0x48a5cd);
  });
  const _0x1b50ea = [];
  let _0x10c5f5 = [];
  const _0x477759 = () => {
    if (!_0x10c5f5['length']) return;
    (_0x1b50ea['push'](_0x10c5f5), (_0x10c5f5 = []));
  };
  return (
    _0x12f9db['forEach'](({ scenes: _0x47df80 }) => {
      if (_0x47df80['length'] > _0x12c24a) {
        _0x477759();
        for (let _0x9149c6 = 0x0; _0x9149c6 < _0x47df80['length']; _0x9149c6 += _0x12c24a) {
          _0x1b50ea['push'](_0x47df80['slice'](_0x9149c6, _0x9149c6 + _0x12c24a));
        }
        return;
      }
      (_0x10c5f5['length'] && _0x10c5f5['length'] + _0x47df80['length'] > _0x12c24a && _0x477759(),
        _0x10c5f5['push'](..._0x47df80));
    }),
    _0x477759(),
    _0x1b50ea
  );
}
function buildOccurrences(_0x481246 = []) {
  const _0x16f9f9 = normalizeStringArray(_0x481246);
  if (!_0x16f9f9['length']) return '当前项目';
  const _0x1c76c2 = _0x16f9f9['map']((_0x5f2211) => {
    const _0x311fa6 = /(?:^|[-_])episode-(\d+)$/iu['exec'](_0x5f2211);
    return _0x311fa6 ? String(Math['max'](0x1, Number(_0x311fa6[0x1]) || 0x1)) : '';
  });
  if (_0x1c76c2['every'](Boolean)) {
    const _0x3bf5e9 = [...new Set(_0x1c76c2['map'](Number))]['sort'](
      (_0x2910a0, _0x106608) => _0x2910a0 - _0x106608,
    );
    return '第\x20' + _0x3bf5e9['join']('、') + '\x20集';
  }
  return _0x16f9f9['map']((_0x224abd, _0x37c20a) =>
    _0x1c76c2[_0x37c20a] ? '第\x20' + _0x1c76c2[_0x37c20a] + '\x20集' : _0x224abd,
  )['join']('、');
}
function deriveSourceEpisodeRefs(_0x3f3f4b, _0x4021dd) {
  return normalizeStringArray(_0x3f3f4b['map']((_0x27ea3c) => _0x4021dd['get'](_0x27ea3c)?.['episodeRef']));
}
function normalizeStoryAssetFinalCharacterRole(_0x29b744 = '') {
  const _0x547870 = normalizeText(_0x29b744);
  if (/主角|男主|女主|主人公/u['test'](_0x547870)) return '主角';
  if (/反派|反面|敌对|敌人|宿敌|对手/u['test'](_0x547870)) return '反派';
  if (/路人|群众|群演|背景人物|无名角色/u['test'](_0x547870)) return '路人';
  return '配角';
}
function normalizeInventoryAssets(
  _0x2ae5c6,
  { sourceScenes: sourceScenes = [], allowEmpty: allowEmpty = ![] } = {},
) {
  const _0x140fdd = new Map(sourceScenes['map']((_0x255de6) => [_0x255de6['ref'], _0x255de6])),
    _0x1e0124 = new Set(_0x140fdd['keys']()),
    _0x5a54fa = (Array['isArray'](_0x2ae5c6) ? _0x2ae5c6 : [])
      ['map']((_0x11022b, _0x5111d4) => {
        const _0x23fef1 = normalizeText(_0x11022b?.['kind']),
          _0x47a70c = normalizeText(_0x11022b?.['name']),
          _0x45bddd = normalizeReference(_0x11022b?.['ref'], 'asset-' + (_0x5111d4 + 0x1));
        if (!_0x47a70c || !['character', 'scene', 'prop']['includes'](_0x23fef1)) return null;
        const _0x451380 =
          _0x23fef1 === 'character'
            ? normalizeStoryAssetFinalCharacterRole(_0x11022b?.['role'])
            : normalizeText(_0x11022b?.['role']);
        let _0x59a755 = normalizeStringArray(_0x11022b?.['sourceSceneRefs'])['filter']((_0x554f0d) =>
          _0x1e0124['has'](_0x554f0d),
        );
        !_0x59a755['length'] &&
          (_0x59a755 = inferStoryAssetSourceSceneRefs(_0x23fef1, _0x47a70c, sourceScenes));
        if (!_0x59a755['length']) return null;
        const _0x50f943 = deriveSourceEpisodeRefs(_0x59a755, _0x140fdd),
          _0x22e01a =
            Array['isArray'](_0x11022b?.['appearances']) && _0x11022b['appearances']['length']
              ? _0x11022b['appearances']
              : [{ ref: _0x45bddd + '-base', name: '基础形象', description: '', sourceSceneRefs: _0x59a755 }],
          _0x495283 =
            _0x23fef1 === 'prop' && _0x22e01a['length'] > 0x1
              ? [
                  {
                    ref: _0x45bddd + '-base',
                    name: '基础形象',
                    description: normalizeStringArray(
                      _0x22e01a['map']((_0x232827) => {
                        const _0x5f1ad5 = normalizeText(_0x232827?.['name']),
                          _0x58e56e = normalizeText(_0x232827?.['description']);
                        if (_0x5f1ad5 && _0x58e56e) return _0x5f1ad5 + '：' + _0x58e56e;
                        return _0x58e56e || _0x5f1ad5;
                      }),
                    )['join']('；'),
                    sourceSceneRefs: _0x59a755,
                  },
                ]
              : _0x22e01a,
          _0x24b3be = _0x495283['map']((_0x10b286, _0x47c777) => {
            const _0x4f5ce0 = normalizeStringArray(
              _0x10b286?.['sourceSceneRefs']?.['length']
                ? _0x10b286['sourceSceneRefs']
                : _0x495283['length'] === 0x1
                  ? _0x59a755
                  : [],
            )['filter']((_0x4c5730) => _0x59a755['includes'](_0x4c5730));
            return {
              ref: normalizeReference(_0x10b286?.['ref'], _0x45bddd + '-appearance-' + (_0x47c777 + 0x1)),
              name:
                normalizeText(_0x10b286?.['name']) ||
                (_0x47c777 === 0x0 ? '基础形象' : '形象 ' + (_0x47c777 + 0x1)),
              description: normalizeText(_0x10b286?.['description']),
              occurrences: buildOccurrences(deriveSourceEpisodeRefs(_0x4f5ce0, _0x140fdd)),
              sourceEpisodeRefs: deriveSourceEpisodeRefs(_0x4f5ce0, _0x140fdd),
              sourceSceneRefs: _0x4f5ce0,
            };
          }),
          _0x4ad683 = _0x24b3be['map']((_0x7e35ca) => _0x7e35ca['ref']);
        if (new Set(_0x4ad683)['size'] !== _0x4ad683['length'])
          throw new Error('资产“' + _0x47a70c + '”规划了重复的形象 ref。');
        return {
          ref: _0x45bddd,
          kind: _0x23fef1,
          name: _0x47a70c,
          role: _0x451380,
          description: normalizeText(_0x11022b?.['description']),
          occurrences: normalizeText(_0x11022b?.['occurrences']) || buildOccurrences(_0x50f943),
          sourceEpisodeRefs: _0x50f943,
          sourceSceneRefs: _0x59a755,
          appearances: _0x24b3be,
        };
      })
      ['filter'](Boolean);
  if (!_0x5a54fa['length'] && !allowEmpty) throw new Error('Agent\x20未返回可用的轻量资产清单。');
  const _0xa2967b = new Set();
  return (
    _0x5a54fa['forEach']((_0xb22f7d, _0x153ec7) => {
      _0xb22f7d['ref'] = createUniqueStoryAssetInventoryRef(
        _0xb22f7d['ref'],
        _0xa2967b,
        'asset-' + (_0x153ec7 + 0x1),
      );
      const _0x4819bd = new Set();
      _0xb22f7d['appearances']['forEach']((_0x556328, _0x9f779f) => {
        _0x556328['ref'] = createUniqueStoryAssetAppearanceRef(
          _0x556328['ref'],
          _0x4819bd,
          _0xb22f7d['ref'] + '-appearance-' + (_0x9f779f + 0x1),
        );
      });
    }),
    _0x5a54fa
  );
}
export function buildStoryAssetInventoryPrompt({
  project: project = {},
  episodes: episodes = [],
  sourceScenes: sourceScenes = null,
} = {}) {
  const _0x32e294 = normalizeStoryContext(project),
    _0x531b41 = Array['isArray'](sourceScenes)
      ? sourceScenes
      : normalizeStoryAssetExtractionSources(episodes);
  if (!_0x531b41['length']) throw new Error('资产清单规划缺少可用的场次正文。');
  const _0x3d1c53 = createDeterministicStoryCharacterCandidateMap(_0x531b41),
    _0x4484e5 = _0x531b41['map']((_0x1e9179) => ({
      ref: _0x1e9179['ref'],
      heading: _0x1e9179['heading'],
      ...(_0x1e9179['isSourceWindow']
        ? { assetHeading: _0x1e9179['assetHeading'] || _0x1e9179['heading'], isSourceWindow: !![] }
        : {}),
      ...(_0x1e9179['characters']['length'] ? { characters: _0x1e9179['characters'] } : {}),
      body: _0x1e9179['body'],
    }));
  return JSON['stringify']({
    task: 'plan_story_asset_inventory',
    schemaVersion: STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION,
    storyContext: _0x32e294,
    deterministicCandidates: {
      characters: [..._0x3d1c53['entries']()]['map'](([_0x53c330, _0x4d1262]) => ({
        name: _0x53c330,
        sourceSceneRefs: normalizeStringArray(_0x4d1262['sourceSceneRefs']),
      })),
    },
    sourceScenes: _0x4484e5,
    requirements: [
      '本轮只输出必要补充：角色或场景的显著形象状态、需要跨标题合并的场景组、关键道具；没有补充时\x20assets\x20返回空数组。',
      '不要逐项复述只有基础形象的角色或普通单场场景；客户端会从\x20deterministicCandidates.characters\x20和\x20sourceScenes\x20本地补齐。',
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
      '每个资产、角色\x20appearance\x20和场景\x20appearance\x20的\x20sourceSceneRefs\x20只能逐字引用\x20sourceScenes[].ref；sourceEpisodeRefs\x20由客户端根据场次确定，无需输出。',
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
  const _0x23d3f7 = Array['isArray'](sourceScenes)
      ? sourceScenes
      : normalizeStoryAssetExtractionSources(episodes),
    _0x43dc58 = Math['max'](0xfa0, Math['trunc'](Number(maxPromptCharacters) || 0x0)),
    _0x9cdf88 = Math['max'](0x1, Math['trunc'](Number(maxSourceScenes) || 0x0)),
    _0x243cc7 = [];
  let _0x105448 = [];
  _0x23d3f7['forEach']((_0x3ea7f3) => {
    const _0x547b7e = [..._0x105448, _0x3ea7f3],
      _0x5e8dec = buildStoryAssetInventoryPrompt({ project: project, sourceScenes: _0x547b7e })['length'];
    if (_0x105448['length'] && (_0x105448['length'] >= _0x9cdf88 || _0x5e8dec > _0x43dc58)) {
      (_0x243cc7['push'](_0x105448), (_0x105448 = [_0x3ea7f3]));
      return;
    }
    _0x105448 = _0x547b7e;
  });
  if (_0x105448['length']) _0x243cc7['push'](_0x105448);
  const _0x2713a8 = _0x243cc7['find'](
    (_0x44210a) =>
      buildStoryAssetInventoryPrompt({ project: project, sourceScenes: _0x44210a })['length'] > _0x43dc58,
  );
  if (_0x2713a8) {
    const _0x3807d7 = _0x2713a8[0x0];
    throw new Error(
      '单个场次“' +
        (_0x3807d7?.['heading'] || _0x3807d7?.['ref'] || '未命名场次') +
        '”正文过长，请先拆分该场次。',
    );
  }
  return _0x243cc7;
}
export function parseStoryAssetInventoryResult(_0x3053b6, { sourceScenes: sourceScenes = [] } = {}) {
  const _0x3c117e = parseStrictJson(getResultText(_0x3053b6), 'Agent 未返回轻量资产清单。'),
    _0x2b248e = normalizeInventoryAssets(_0x3c117e?.['assets'], {
      sourceScenes: sourceScenes,
      allowEmpty: !![],
    }),
    _0x10fa88 = new Set(sourceScenes['map']((_0x4267a2) => _0x4267a2['ref'])),
    _0x272a56 = (Array['isArray'](_0x3c117e?.['sceneAudits']) ? _0x3c117e['sceneAudits'] : [])['map'](
      (_0x3224b2) => ({
        sourceSceneRef: normalizeText(
          _0x3224b2?.['sourceSceneRef'] || _0x3224b2?.['sceneRef'] || _0x3224b2?.['ref'],
        ),
        characterNames: normalizeStringArray(_0x3224b2?.['characterNames']),
        keyPropNames: normalizeStringArray(_0x3224b2?.['keyPropNames']),
      }),
    ),
    _0x2cee66 = _0x272a56['map']((_0x512dca) => _0x512dca['sourceSceneRef']),
    _0x4e4d73 = _0x2cee66['find']((_0x4bb173) => !_0x10fa88['has'](_0x4bb173));
  if (_0x4e4d73) throw new Error('场次审计引用了不存在的场次：' + _0x4e4d73 + '。');
  if (new Set(_0x2cee66)['size'] !== _0x2cee66['length'])
    throw new Error('场次审计包含重复的\x20sourceSceneRef。');
  const _0x3c9286 = new Map(_0x272a56['map']((_0x95bdcb) => [_0x95bdcb['sourceSceneRef'], _0x95bdcb])),
    _0x3ec33b = sourceScenes['map']((_0x3954a4) => ({
      sourceSceneRef: _0x3954a4['ref'],
      characterNames: normalizeStringArray([
        ...(_0x3c9286['get'](_0x3954a4['ref'])?.['characterNames'] || []),
        ..._0x2b248e['filter'](
          (_0x1df5e7) =>
            _0x1df5e7['kind'] === 'character' && _0x1df5e7['sourceSceneRefs']['includes'](_0x3954a4['ref']),
        )['map']((_0xe606f4) => _0xe606f4['name']),
      ]),
      keyPropNames: normalizeStringArray([
        ...(_0x3c9286['get'](_0x3954a4['ref'])?.['keyPropNames'] || []),
        ..._0x2b248e['filter'](
          (_0x31511b) =>
            _0x31511b['kind'] === 'prop' && _0x31511b['sourceSceneRefs']['includes'](_0x3954a4['ref']),
        )['map']((_0xc7e0d6) => _0xc7e0d6['name']),
      ]),
    }));
  return {
    schemaVersion: STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION,
    assets: _0x2b248e,
    sceneAudits: _0x3ec33b,
  };
}
function getStoryAssetInventoryIdentity(_0x1fbd8c = {}) {
  return normalizeText(_0x1fbd8c?.['kind']) + ':' + normalizeText(_0x1fbd8c?.['name'])['toLowerCase']();
}
function resolveMergedStoryCharacterRole(_0x53272c = '', _0x188e8b = '') {
  const _0x5128ba = [
    normalizeStoryAssetFinalCharacterRole(_0x53272c),
    normalizeStoryAssetFinalCharacterRole(_0x188e8b),
  ];
  if (_0x5128ba['includes']('主角')) return '主角';
  if (_0x5128ba['includes']('反派')) return '反派';
  if (_0x5128ba['includes']('配角')) return '配角';
  return '路人';
}
function createUniqueStoryAssetInventoryRef(_0x2f44ac, _0x2ab3fe, _0x47d701) {
  const _0x75620c = normalizeReference(_0x2f44ac, _0x47d701);
  let _0x4836cb = _0x75620c,
    _0xab6a27 = 0x2;
  while (_0x2ab3fe['has'](_0x4836cb)) {
    ((_0x4836cb = _0x75620c + '-' + _0xab6a27), (_0xab6a27 += 0x1));
  }
  return (_0x2ab3fe['add'](_0x4836cb), _0x4836cb);
}
function createUniqueStoryAssetAppearanceRef(_0x3836b5, _0x6da9e5, _0x4c6aae) {
  const _0x263034 = normalizeReference(_0x3836b5, _0x4c6aae);
  if (!_0x6da9e5['has'](_0x263034)) return (_0x6da9e5['add'](_0x263034), _0x263034);
  return createUniqueStoryAssetInventoryRef(_0x4c6aae, _0x6da9e5, _0x4c6aae);
}
function mergeStoryAssetInventoryAppearance(_0x2f45de, _0x33633a) {
  return (
    (_0x2f45de['description'] = _0x2f45de['description'] || _0x33633a['description']),
    (_0x2f45de['sourceSceneRefs'] = normalizeStringArray([
      ..._0x2f45de['sourceSceneRefs'],
      ..._0x33633a['sourceSceneRefs'],
    ])),
    _0x2f45de
  );
}
export function mergeStoryAssetInventoryResults(_0x4b67fa = [], { sourceScenes: sourceScenes = [] } = {}) {
  const _0x1f71d7 = [],
    _0x452ba1 = new Map(),
    _0x44e45e = new Map();
  (Array['isArray'](_0x4b67fa) ? _0x4b67fa : [])['forEach']((_0x4403e9) => {
    ((Array['isArray'](_0x4403e9?.['assets']) ? _0x4403e9['assets'] : [])['forEach']((_0xf1999a) => {
      const _0x41b660 = getStoryAssetInventoryIdentity(_0xf1999a),
        _0x4ca60c = _0x452ba1['get'](_0x41b660);
      if (!_0x4ca60c) {
        const _0x1e4f47 = {
          ..._0xf1999a,
          sourceSceneRefs: [..._0xf1999a['sourceSceneRefs']],
          appearances: _0xf1999a['appearances']['map']((_0x2837bf) => ({
            ..._0x2837bf,
            sourceSceneRefs: [..._0x2837bf['sourceSceneRefs']],
          })),
        };
        (_0x452ba1['set'](_0x41b660, _0x1e4f47), _0x1f71d7['push'](_0x1e4f47));
        return;
      }
      ((_0x4ca60c['description'] = _0x4ca60c['description'] || _0xf1999a['description']),
        (_0x4ca60c['sourceSceneRefs'] = normalizeStringArray([
          ..._0x4ca60c['sourceSceneRefs'],
          ..._0xf1999a['sourceSceneRefs'],
        ])));
      if (_0x4ca60c['kind'] === 'character')
        _0x4ca60c['role'] = resolveMergedStoryCharacterRole(_0x4ca60c['role'], _0xf1999a['role']);
      else {
        if (_0x4ca60c['kind'] === 'prop') {
          const _0x26d901 = _0x4ca60c['appearances'][0x0];
          _0xf1999a['appearances']['forEach']((_0x57f6ce) => {
            mergeStoryAssetInventoryAppearance(_0x26d901, _0x57f6ce);
          });
          return;
        }
      }
      _0xf1999a['appearances']['forEach']((_0x40ce68) => {
        const _0x341d09 = normalizeText(_0x40ce68['name'])['toLowerCase'](),
          _0x3abe58 = _0x4ca60c['appearances']['find'](
            (_0x570959) => normalizeText(_0x570959['name'])['toLowerCase']() === _0x341d09,
          );
        _0x3abe58
          ? mergeStoryAssetInventoryAppearance(_0x3abe58, _0x40ce68)
          : _0x4ca60c['appearances']['push']({
              ..._0x40ce68,
              sourceSceneRefs: [..._0x40ce68['sourceSceneRefs']],
            });
      });
    }),
      (Array['isArray'](_0x4403e9?.['sceneAudits']) ? _0x4403e9['sceneAudits'] : [])['forEach'](
        (_0x5c52b3) => {
          const _0x1686fb = normalizeText(_0x5c52b3?.['sourceSceneRef']);
          if (!_0x1686fb) return;
          const _0x3a7b2d = _0x44e45e['get'](_0x1686fb) || {
            sourceSceneRef: _0x1686fb,
            characterNames: [],
            keyPropNames: [],
          };
          ((_0x3a7b2d['characterNames'] = normalizeStringArray([
            ..._0x3a7b2d['characterNames'],
            ...normalizeStringArray(_0x5c52b3?.['characterNames']),
          ])),
            (_0x3a7b2d['keyPropNames'] = normalizeStringArray([
              ..._0x3a7b2d['keyPropNames'],
              ...normalizeStringArray(_0x5c52b3?.['keyPropNames']),
            ])),
            _0x44e45e['set'](_0x1686fb, _0x3a7b2d));
        },
      ));
  });
  const _0x22c346 = new Set(),
    _0x7f077a = new Set();
  return (
    _0x1f71d7['forEach']((_0x417b1e, _0x4ea177) => {
      ((_0x417b1e['ref'] = createUniqueStoryAssetInventoryRef(
        _0x417b1e['ref'],
        _0x22c346,
        'asset-' + (_0x4ea177 + 0x1),
      )),
        (_0x417b1e['appearances'] = _0x417b1e['appearances']['map']((_0x5c7825, _0x9a98d5) => ({
          ..._0x5c7825,
          ref: createUniqueStoryAssetAppearanceRef(
            _0x5c7825['ref'],
            _0x7f077a,
            _0x417b1e['ref'] + '-appearance-' + (_0x9a98d5 + 0x1),
          ),
        }))));
    }),
    parseStoryAssetInventoryResult(
      { assets: _0x1f71d7, sceneAudits: [..._0x44e45e['values']()] },
      { sourceScenes: sourceScenes },
    )
  );
}
function pushCoverageIssue(_0x219d5a, _0x2089e4) {
  const _0x5bd42b = JSON['stringify'](_0x2089e4);
  if (!_0x219d5a['some']((_0x5d3b5b) => JSON['stringify'](_0x5d3b5b) === _0x5bd42b))
    _0x219d5a['push'](_0x2089e4);
}
export function inspectStoryAssetInventoryCoverage(_0x4108b1 = {}, _0x4eac46 = []) {
  const _0x27e76c = Array['isArray'](_0x4108b1?.['assets']) ? _0x4108b1['assets'] : [],
    _0xd23608 = new Map(
      (Array['isArray'](_0x4108b1?.['sceneAudits']) ? _0x4108b1['sceneAudits'] : [])['map']((_0x447a4e) => [
        _0x447a4e['sourceSceneRef'],
        _0x447a4e,
      ]),
    ),
    _0x538b2b = [];
  return (
    _0x4eac46['forEach']((_0x14cd85) => {
      const _0x54ae1f = _0x27e76c['filter'](
          (_0x5f828) =>
            _0x5f828['kind'] === 'scene' && _0x5f828['sourceSceneRefs']['includes'](_0x14cd85['ref']),
        ),
        _0xe9fc80 = /[/／|｜]/u['test'](normalizeText(_0x14cd85?.['assetHeading'] || _0x14cd85?.['heading']));
      ((!_0x54ae1f['length'] || (!_0xe9fc80 && _0x54ae1f['length'] > 0x1)) &&
        pushCoverageIssue(_0x538b2b, {
          type: _0x54ae1f['length'] ? 'duplicate-scene-assets' : 'missing-scene-asset',
          sourceSceneRef: _0x14cd85['ref'],
          expectedName: _0x14cd85['heading'],
          assetRefs: _0x54ae1f['map']((_0x46d6f4) => _0x46d6f4['ref']),
        }),
        (_0xd23608['get'](_0x14cd85['ref'])?.['keyPropNames'] || [])['forEach']((_0x587a50) => {
          const _0x3afde0 = _0x27e76c['filter'](
            (_0x39f230) =>
              _0x39f230['kind'] === 'prop' &&
              _0x39f230['name'] === _0x587a50 &&
              _0x39f230['sourceSceneRefs']['includes'](_0x14cd85['ref']),
          );
          _0x3afde0['length'] !== 0x1 &&
            pushCoverageIssue(_0x538b2b, {
              type: _0x3afde0['length'] ? 'duplicate-key-props' : 'missing-key-prop',
              sourceSceneRef: _0x14cd85['ref'],
              expectedName: _0x587a50,
              assetRefs: _0x3afde0['map']((_0x3b0669) => _0x3b0669['ref']),
            });
        }),
        (_0xd23608['get'](_0x14cd85['ref'])?.['characterNames'] || [])['forEach']((_0x357723) => {
          const _0x49f010 = _0x27e76c['filter'](
            (_0x211a05) =>
              _0x211a05['kind'] === 'character' &&
              storyCharacterNamesOverlap(_0x211a05['name'], _0x357723) &&
              _0x211a05['sourceSceneRefs']['includes'](_0x14cd85['ref']),
          );
          _0x49f010['length'] !== 0x1 &&
            pushCoverageIssue(_0x538b2b, {
              type: _0x49f010['length'] ? 'duplicate-scene-characters' : 'missing-scene-character',
              sourceSceneRef: _0x14cd85['ref'],
              expectedName: _0x357723,
              assetRefs: _0x49f010['map']((_0xf70f7e) => _0xf70f7e['ref']),
            });
        }));
    }),
    _0x27e76c['forEach']((_0x2bb13a) => {
      _0x2bb13a['sourceSceneRefs']['forEach']((_0x37881d) => {
        const _0x7df615 = _0x2bb13a['appearances']
          ['filter']((_0x5a48c4) => _0x5a48c4['sourceSceneRefs']['includes'](_0x37881d))
          ['map']((_0xc570f) => _0xc570f['ref']);
        !_0x7df615['length'] &&
          pushCoverageIssue(_0x538b2b, {
            type: 'missing-appearance-mapping',
            sourceSceneRef: _0x37881d,
            expectedName: _0x2bb13a['name'],
            assetRefs: [_0x2bb13a['ref']],
            appearanceRefs: _0x7df615,
          });
      });
    }),
    _0x538b2b
  );
}
export function buildStoryAssetInventoryRepairPrompt({
  inventory: inventory = {},
  sourceScenes: sourceScenes = [],
  coverageIssues: coverageIssues = [],
} = {}) {
  const _0x40d985 = new Set(coverageIssues['map']((_0x2b2930) => _0x2b2930['sourceSceneRef'])),
    _0x26e722 = new Set(coverageIssues['flatMap']((_0x33241e) => _0x33241e['assetRefs'] || [])),
    _0x1c4638 = sourceScenes['filter']((_0x135f20) => _0x40d985['has'](_0x135f20['ref'])),
    _0x1a1bd5 = (inventory['assets'] || [])['filter'](
      (_0x4fb52e) =>
        _0x26e722['has'](_0x4fb52e['ref']) ||
        _0x4fb52e['sourceSceneRefs']['some']((_0x4770e2) => _0x40d985['has'](_0x4770e2)),
    );
  return JSON['stringify']({
    task: 'repair_story_asset_inventory_coverage',
    schemaVersion: STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION,
    coverageIssues: coverageIssues,
    sourceScenes: _0x1c4638,
    currentAssets: _0x1a1bd5,
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
  const _0x596904 = Math['max'](0xfa0, Math['trunc'](Number(maxPromptCharacters) || 0x0)),
    _0x43df2a = [];
  let _0x959fe = [];
  coverageIssues['forEach']((_0x436699) => {
    const _0x2d3424 = [..._0x959fe, _0x436699],
      _0x66a203 = buildStoryAssetInventoryRepairPrompt({
        inventory: inventory,
        sourceScenes: sourceScenes,
        coverageIssues: _0x2d3424,
      })['length'];
    if (_0x959fe['length'] && _0x66a203 > _0x596904) {
      (_0x43df2a['push'](_0x959fe), (_0x959fe = [_0x436699]));
      return;
    }
    _0x959fe = _0x2d3424;
  });
  if (_0x959fe['length']) _0x43df2a['push'](_0x959fe);
  return _0x43df2a;
}
function parseStoryAssetInventoryRepairResult(
  _0x46331f,
  { sourceScenes: sourceScenes = [], inventory: inventory = {} } = {},
) {
  const _0x5110d0 = parseStrictJson(getResultText(_0x46331f), 'Agent 未返回资产清单修复结果。'),
    _0x542e36 = normalizeInventoryAssets(_0x5110d0?.['upserts'], {
      sourceScenes: sourceScenes,
      allowEmpty: !![],
    }),
    _0x1c4322 = new Set((inventory['assets'] || [])['map']((_0x3fbc91) => _0x3fbc91['ref'])),
    _0x5a91dc = normalizeStringArray(_0x5110d0?.['removeAssetRefs']),
    _0x17e59c = _0x5a91dc['find']((_0x5d551e) => !_0x1c4322['has'](_0x5d551e));
  if (_0x17e59c) throw new Error('资产清单修复尝试删除不存在的资产：' + _0x17e59c + '。');
  if (!_0x542e36['length'] && !_0x5a91dc['length']) throw new Error('资产清单修复没有返回任何改动。');
  return { upserts: _0x542e36, removeAssetRefs: _0x5a91dc };
}
function applyStoryAssetInventoryRepair(_0x3ce3ef, _0x29af1c) {
  const _0x433c97 = new Set(_0x29af1c['removeAssetRefs'] || []),
    _0x149615 = new Map((_0x29af1c['upserts'] || [])['map']((_0x36b71f) => [_0x36b71f['ref'], _0x36b71f])),
    _0x1d86c0 = (_0x3ce3ef['assets'] || [])
      ['filter']((_0x33c95b) => !_0x433c97['has'](_0x33c95b['ref']))
      ['map']((_0x24c2bf) => _0x149615['get'](_0x24c2bf['ref']) || _0x24c2bf),
    _0xa91c77 = new Set(_0x1d86c0['map']((_0x2b0924) => _0x2b0924['ref']));
  return (
    (_0x29af1c['upserts'] || [])['forEach']((_0x3487ba) => {
      !_0xa91c77['has'](_0x3487ba['ref']) &&
        (_0x1d86c0['push'](_0x3487ba), _0xa91c77['add'](_0x3487ba['ref']));
    }),
    { ..._0x3ce3ef, assets: _0x1d86c0 }
  );
}
export function createStoryAssetExtractionBatches(
  _0x500b3b = [],
  {
    targetOutputCharacters: targetOutputCharacters = STORY_ASSET_DETAIL_TARGET_OUTPUT_CHARACTERS,
    maxOutputCharacters: maxOutputCharacters = STORY_ASSET_DETAIL_MAX_OUTPUT_CHARACTERS,
    maxAssetsPerBatch: maxAssetsPerBatch = STORY_ASSET_DETAIL_MAX_ASSETS_PER_BATCH,
    estimateByKind: estimateByKind = {},
  } = {},
) {
  const _0x53d258 = Array['isArray'](_0x500b3b) ? _0x500b3b : [];
  if (!_0x53d258['length']) return [];
  const _0x1ae802 = Math['max'](0xfa0, Math['trunc'](Number(targetOutputCharacters) || 0x0)),
    _0x5afaff = Math['max'](_0x1ae802, Math['trunc'](Number(maxOutputCharacters) || 0x0)),
    _0x384f01 = Math['max'](0x1, Math['trunc'](Number(maxAssetsPerBatch) || 0x0)),
    _0x4b5d90 = { character: 0x898, scene: 0x4b0, prop: 0x4b0 },
    _0x1bff5d = (_0xdc5891 = {}) => {
      const _0x46370f = normalizeText(_0xdc5891?.['kind']),
        _0x80dc29 = Math['max'](
          0x258,
          Math['trunc'](Number(estimateByKind?.[_0x46370f]) || _0x4b5d90[_0x46370f] || 0x578),
        ),
        _0x44222b = Math['max'](
          0x1,
          Array['isArray'](_0xdc5891?.['appearances']) ? _0xdc5891['appearances']['length'] : 0x1,
        );
      return Math['min'](_0x5afaff, _0x80dc29 + Math['max'](0x0, _0x44222b - 0x1) * 0x44c);
    },
    _0x281e2d = [];
  let _0x115449 = [],
    _0x5a6abc = 0x0;
  _0x53d258['forEach']((_0x5965f5) => {
    const _0x3d20ec = _0x1bff5d(_0x5965f5);
    (_0x115449['length'] &&
      (_0x115449['length'] >= _0x384f01 || _0x5a6abc + _0x3d20ec > _0x1ae802) &&
      (_0x281e2d['push'](_0x115449), (_0x115449 = []), (_0x5a6abc = 0x0)),
      _0x115449['push'](_0x5965f5),
      (_0x5a6abc += _0x3d20ec),
      _0x5a6abc >= _0x5afaff && (_0x281e2d['push'](_0x115449), (_0x115449 = []), (_0x5a6abc = 0x0)));
  });
  if (_0x115449['length']) _0x281e2d['push'](_0x115449);
  return _0x281e2d;
}
function compactStoryAssetDetailSourceBody(_0x381bc0 = '') {
  const _0x2c1e73 = normalizeText(_0x381bc0);
  if ([..._0x2c1e73]['length'] <= STORY_ASSET_DETAIL_SOURCE_BODY_MAX_CHARACTERS) return _0x2c1e73;
  const _0x26b65f = '\n……\n',
    _0x15ae14 = Math['max'](0x1, STORY_ASSET_DETAIL_SOURCE_BODY_MAX_CHARACTERS - [..._0x26b65f]['length']),
    _0x5726b1 = Math['floor'](_0x15ae14 * 0.7),
    _0x482621 = _0x15ae14 - _0x5726b1;
  return (
    '' +
    [..._0x2c1e73]['slice'](0x0, _0x5726b1)['join']('') +
    _0x26b65f +
    [..._0x2c1e73]['slice'](-_0x482621)['join']('')
  );
}
function selectStoryAssetDetailSourceScenes(_0x1a7b52 = [], _0x426be6 = []) {
  const _0x214828 = new Set(),
    _0x43bbf5 = (_0x5cb908) => {
      const _0x56bb5c = normalizeText(_0x5cb908);
      if (!_0x56bb5c || _0x214828['size'] >= STORY_ASSET_DETAIL_SOURCE_SCENE_MAX_COUNT) return;
      _0x214828['add'](_0x56bb5c);
    };
  return (
    _0x1a7b52['forEach']((_0x44b911) => _0x43bbf5(_0x44b911['sourceSceneRefs'][0x0])),
    _0x1a7b52['forEach']((_0x58b8d0) => {
      _0x58b8d0['appearances']['forEach']((_0x2e69e6) => _0x43bbf5(_0x2e69e6['sourceSceneRefs'][0x0]));
    }),
    _0x1a7b52['forEach']((_0x4c6d62) => _0x43bbf5(_0x4c6d62['sourceSceneRefs']['at'](-0x1))),
    _0x426be6['filter']((_0x4bb0d9) => _0x214828['has'](_0x4bb0d9['ref']))['map']((_0x45bb7a) => ({
      ..._0x45bb7a,
      body: compactStoryAssetDetailSourceBody(_0x45bb7a['body']),
    }))
  );
}
export function buildStoryAssetDetailBatchPrompt({
  project: project = {},
  sourceScenes: sourceScenes = [],
  batches: batches = [],
  batchIndex: batchIndex = 0x0,
  aspectRatio: aspectRatio = '',
  visualStyle: visualStyle = '',
} = {}) {
  const _0x54b76d = normalizeStoryContext(project),
    _0x700f32 = Array['isArray'](batches?.[batchIndex]) ? batches[batchIndex] : [];
  if (!_0x700f32['length']) throw new Error('资产提取缺少当前细化批次。');
  const _0x481577 = _0x700f32['map']((_0x331d62) => ({
      ref: _0x331d62['ref'],
      kind: _0x331d62['kind'],
      name: _0x331d62['name'],
      role: _0x331d62['role'],
      appearances: _0x331d62['appearances']['map']((_0x18cd50) => ({
        ref: _0x18cd50['ref'],
        name: _0x18cd50['name'],
      })),
    })),
    _0x136943 = createStoryAssetEvidenceDossiers(_0x700f32, sourceScenes, { includeSourceMappings: ![] }),
    _0x1a971c = normalizeText(visualStyle) || _0x54b76d['visualStyle'];
  return JSON['stringify']({
    task: 'detail_story_asset_batch',
    schemaVersion: STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION,
    batch: { index: batchIndex + 0x1, total: batches['length'] },
    storyContext: {
      title: _0x54b76d['title'],
      storyType: _0x54b76d['storyType'],
      summary: _0x54b76d['summary'],
      background: _0x54b76d['background'],
      setting: _0x54b76d['setting'],
      continuityFacts: _0x54b76d['continuityFacts'],
      characters: _0x54b76d['characters'],
    },
    visualDirection: {
      aspectRatio: normalizeText(aspectRatio) || _0x54b76d['aspectRatio'],
      style: _0x1a971c,
    },
    assetPlans: _0x481577,
    evidenceDossiers: _0x136943,
    requirements: [
      '严格按 assetPlans 顺序返回同 ref 的全部资产，不得新增、删除、合并或重排。',
      '严格按每个 assetPlans[].appearances 顺序返回同 ref 的全部形象，不得改变来源映射。',
      'storyContext.characters[].fixedTraits 与 continuityFacts 优先于自由视觉设计，任何资产设定都不得与其冲突。',
      '逐项阅读与 assetPlans[].ref 对应的 evidenceDossiers[].evidence；不需要也不得索取完整剧本。',
      'scriptFacts 只写证据明确支持的身份、外观、关系、归属、空间结构或状态；证据没写的内容不得放入 scriptFacts。',
      '为了形成可直接生成的完整形象，可以在\x20visualDesign\x20中合理补足年龄外观、五官、发型、服装细节、配色、材质或空间视觉细节。',
      'description 必须由“剧本事实：...”和“视觉补全：...”组成；没有明确事实或无需补全时对应部分写“未明确”或“无需补全”。',
      STORY_ASSET_VOICE_DESCRIPTION_RULE,
      '每个 appearance.prompt 必须信息充分、可直接用于图片生成。',
      '角色\x20prompt\x20必须聚焦脸部、发型、体态、服装、鞋履和必要穿戴细节，采用自然站立的正面全身独立人设图，不写剧情道具、动作表演或场景环境。',
      '最终\x20prompt\x20只写正向视觉内容，不复述任何规则、限制、处理流程、模型说明或其他元说明措辞。',
      '场景 prompt 默认无人；道具 prompt 默认无人手持。',
      _0x1a971c
        ? '每个 appearance.prompt 必须逐字以 visualDirection.style 的完整内容开头。'
        : '图片提示词保持统一视觉方向。',
    ],
    outputSchema: {
      assets: [
        {
          ref: '逐字使用\x20assetPlans[].ref',
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
  _0x42536b = [],
  {
    project: project = {},
    sourceScenes: sourceScenes = [],
    aspectRatio: aspectRatio = '',
    visualStyle: visualStyle = '',
    estimateByKind: estimateByKind = {},
    maxPromptCharacters: maxPromptCharacters = STORY_ASSET_DETAIL_PROMPT_TARGET_CHARACTERS,
  } = {},
) {
  const _0x4d302f = Math['max'](0x1f40, Math['trunc'](Number(maxPromptCharacters) || 0x0)),
    _0x4caacc = createStoryAssetExtractionBatches(_0x42536b, { estimateByKind: estimateByKind }),
    _0x54153e = [];
  return (
    _0x4caacc['forEach']((_0x336529) => {
      let _0x16349c = [];
      _0x336529['forEach']((_0x30355a) => {
        const _0x57a01f = [..._0x16349c, _0x30355a],
          _0x139ed4 = buildStoryAssetDetailBatchPrompt({
            project: project,
            sourceScenes: sourceScenes,
            batches: [_0x57a01f],
            batchIndex: 0x0,
            aspectRatio: aspectRatio,
            visualStyle: visualStyle,
          })['length'];
        if (_0x16349c['length'] && _0x139ed4 > _0x4d302f) {
          (_0x54153e['push'](_0x16349c), (_0x16349c = [_0x30355a]));
          const _0x21a429 = buildStoryAssetDetailBatchPrompt({
            project: project,
            sourceScenes: sourceScenes,
            batches: [_0x16349c],
            batchIndex: 0x0,
            aspectRatio: aspectRatio,
            visualStyle: visualStyle,
          })['length'];
          if (_0x21a429 > _0x4d302f)
            throw new Error(
              '资产“' +
                _0x30355a['name'] +
                '”的证据档案达到 ' +
                _0x21a429 +
                ' 字，超过单批 ' +
                _0x4d302f +
                ' 字上限。',
            );
          return;
        }
        if (_0x139ed4 > _0x4d302f)
          throw new Error(
            '资产“' +
              _0x30355a['name'] +
              '”的证据档案达到\x20' +
              _0x139ed4 +
              ' 字，超过单批 ' +
              _0x4d302f +
              '\x20字上限。',
          );
        _0x16349c = _0x57a01f;
      });
      if (_0x16349c['length']) _0x54153e['push'](_0x16349c);
    }),
    _0x54153e
  );
}
const STORY_ASSET_VOICE_DESCRIPTION_FIELDS = Object['freeze']([
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
function normalizeStoryAssetNaturalVoiceDescription(_0x587639) {
  const _0x2a19d9 =
      _0x587639 && typeof _0x587639 === 'object' && !Array['isArray'](_0x587639) ? _0x587639 : null,
    _0x1b9ed1 = normalizeText(_0x587639);
  if (!_0x1b9ed1 && !_0x2a19d9) return '';
  try {
    const _0x50e52c = _0x2a19d9 || JSON['parse'](_0x1b9ed1);
    if (_0x50e52c && typeof _0x50e52c === 'object' && !Array['isArray'](_0x50e52c)) {
      const _0xc7025d = {
        年龄: normalizeText(_0x50e52c['年龄'] || _0x50e52c['age']),
        性别: normalizeText(_0x50e52c['性别'] || _0x50e52c['gender']),
        身份: normalizeText(_0x50e52c['身份'] || _0x50e52c['identity']),
        口音: normalizeText(_0x50e52c['口音'] || _0x50e52c['accent']),
        情绪底色: normalizeText(
          _0x50e52c['情绪底色'] || _0x50e52c['emotionalBase'] || _0x50e52c['emotionalTone'],
        ),
        声线: normalizeText(
          _0x50e52c['声线'] || _0x50e52c['voiceTexture'] || _0x50e52c['voiceType'] || _0x50e52c['voice'],
        ),
        语速: normalizeText(_0x50e52c['语速'] || _0x50e52c['voiceSpeed'] || _0x50e52c['speed']),
        说话方式: normalizeText(
          _0x50e52c['说话方式'] ||
            _0x50e52c['speechPattern'] ||
            _0x50e52c['speechManner'] ||
            _0x50e52c['speakingStyle'],
        ),
        音色特征: normalizeText(_0x50e52c['音色特征'] || _0x50e52c['timbre'] || _0x50e52c['toneColor']),
      };
      if (STORY_ASSET_VOICE_DESCRIPTION_FIELDS['some']((_0x48a087) => _0xc7025d[_0x48a087]))
        return STORY_ASSET_VOICE_DESCRIPTION_FIELDS['filter']((_0x434d44) => _0xc7025d[_0x434d44])
          ['map']((_0x22375d) => _0x22375d + '：' + _0xc7025d[_0x22375d])
          ['join']('；');
    }
  } catch {}
  if (!_0x1b9ed1) return '';
  if (
    STORY_ASSET_VOICE_DESCRIPTION_FIELDS['every']((_0x3591b2) =>
      new RegExp(_0x3591b2 + '\x5cs*[：:]', 'u')['test'](_0x1b9ed1),
    )
  )
    return _0x1b9ed1;
  const _0x1ae170 = (_0x112612) =>
      normalizeText(
        _0x1b9ed1['match'](
          new RegExp(_0x112612 + '(?:为|是|偏|呈|如|习惯|[:：])?([^，,；;。]+)', 'u'),
        )?.[0x1],
      ),
    _0x3a0e12 = normalizeText(
      _0x1b9ed1['match'](/(?:^|[，,；;])(?:约)?(幼年|少年|青年|中年|中老年|老年)/u)?.[0x1],
    ),
    _0x2aad5b = normalizeText(
      _0x1b9ed1['match'](
        /(?:约)?([零〇一二两三四五六七八九十百\d]{1,4}岁|[二三四五六七八九]十(?:出头|上下))/u,
      )?.[0x1],
    ),
    _0x4dc722 = /女性|女声/u['test'](_0x1b9ed1) ? '女' : /男性|男声/u['test'](_0x1b9ed1) ? '男' : '',
    _0x2611d6 = _0x1b9ed1['split'](/[，,；;。]+/u)
      ['map'](normalizeText)
      ['filter'](Boolean),
    _0x4e60ab = _0x1b9ed1['split'](/[；;]+/u)
      ['map'](normalizeText)
      ['filter'](Boolean);
  if (
    _0x4e60ab['length'] === STORY_ASSET_VOICE_DESCRIPTION_FIELDS['length'] &&
    (_0x3a0e12 || _0x2aad5b) &&
    _0x4dc722 &&
    /口音/u['test'](_0x4e60ab[0x3]) &&
    /声线/u['test'](_0x4e60ab[0x5]) &&
    /语速/u['test'](_0x4e60ab[0x6]) &&
    /说话/u['test'](_0x4e60ab[0x7]) &&
    /音色/u['test'](_0x4e60ab[0x8])
  ) {
    const _0x2740fa = (_0x9e75fa, _0x24d512) =>
        normalizeText(
          _0x9e75fa['replace'](
            new RegExp('^' + _0x24d512 + '\x5cs*(?:约|为|是|偏|呈|[:：])?\x5cs*', 'u'),
            '',
          ),
        ),
      _0x2e194f = {
        年龄: normalizeStringArray([_0x3a0e12, _0x2aad5b])['join']('，'),
        性别: _0x4dc722,
        身份: _0x2740fa(_0x4e60ab[0x2], '身份'),
        口音: _0x2740fa(_0x4e60ab[0x3], '口音'),
        情绪底色: _0x2740fa(_0x4e60ab[0x4], '情绪底色'),
        声线: _0x2740fa(_0x4e60ab[0x5], '声线'),
        语速: _0x2740fa(_0x4e60ab[0x6], '语速'),
        说话方式: _0x2740fa(_0x4e60ab[0x7], '说话方式'),
        音色特征: _0x2740fa(_0x4e60ab[0x8], '音色(?:特征)?'),
      };
    if (STORY_ASSET_VOICE_DESCRIPTION_FIELDS['every']((_0x2a28cb) => _0x2e194f[_0x2a28cb]))
      return STORY_ASSET_VOICE_DESCRIPTION_FIELDS['map'](
        (_0x28ecb0) => _0x28ecb0 + '：' + _0x2e194f[_0x28ecb0],
      )['join']('；');
  }
  const _0x1edcf9 = _0x2611d6['find'](
      (_0x71180c, _0x5e76ee) =>
        _0x5e76ee > 0x0 &&
        !/(?:幼年|少年|青年|中年|中老年|老年|男性|女性|男声|女声)/u['test'](_0x71180c) &&
        !/(?:[零〇一二两三四五六七八九十百\d]{1,4}岁|[二三四五六七八九]十(?:出头|上下))/u['test'](
          _0x71180c,
        ) &&
        !/^(?:身份|口音|情绪底色|声线|语速|说话方式|音色)/u['test'](_0x71180c),
    ),
    _0x30d261 = {
      年龄: normalizeStringArray([_0x3a0e12, _0x2aad5b])['join']('，'),
      性别: _0x4dc722,
      身份: _0x1ae170('身份') || _0x1edcf9,
      口音: _0x1ae170('口音'),
      情绪底色: _0x1ae170('情绪底色'),
      声线: _0x1ae170('声线'),
      语速: _0x1ae170('语速'),
      说话方式: _0x1ae170('说话方式'),
      音色特征: _0x1ae170('音色(?:特征)?'),
    };
  if (STORY_ASSET_VOICE_DESCRIPTION_FIELDS['some']((_0x57032d) => !_0x30d261[_0x57032d])) return _0x1b9ed1;
  return STORY_ASSET_VOICE_DESCRIPTION_FIELDS['map']((_0x367177) => _0x367177 + '：' + _0x30d261[_0x367177])[
    'join'
  ]('；');
}
function parseStoryAssetDetailBatchResult(
  _0x5d91d5,
  { assetPlans: assetPlans = [], chapterIds: chapterIds = [], visualStyle: visualStyle = '' } = {},
) {
  const _0x418945 = parseStrictJson(getResultText(_0x5d91d5), 'Agent 未返回资产细化结果。'),
    _0x5441a8 = Array['isArray'](_0x418945?.['assets']) ? _0x418945['assets'] : [],
    _0x4208e8 = new Map(_0x5441a8['map']((_0x33ead7) => [normalizeReference(_0x33ead7?.['ref']), _0x33ead7]));
  if (_0x5441a8['length'] !== assetPlans['length'] || _0x4208e8['size'] !== assetPlans['length'])
    throw new Error('资产细化结果必须与当前批次资产数量完全一致。');
  const _0x4d07ba = assetPlans['map']((_0x5bb256) => {
      const _0x3b4308 = _0x4208e8['get'](_0x5bb256['ref']);
      if (!_0x3b4308) throw new Error('资产细化结果缺少“' + _0x5bb256['ref'] + '”。');
      const _0x5d87b8 = Array['isArray'](_0x3b4308?.['appearances']) ? _0x3b4308['appearances'] : [],
        _0xfde13c = new Map(
          _0x5d87b8['map']((_0x396b31) => [normalizeReference(_0x396b31?.['ref']), _0x396b31]),
        );
      if (
        _0x5d87b8['length'] !== _0x5bb256['appearances']['length'] ||
        _0xfde13c['size'] !== _0x5bb256['appearances']['length']
      )
        throw new Error('资产“' + _0x5bb256['name'] + '”的形象数量与轻量清单不一致。');
      return {
        ..._0x3b4308,
        ref: _0x5bb256['ref'],
        kind: _0x5bb256['kind'],
        name: _0x5bb256['name'],
        role: _0x5bb256['role'],
        voiceDescription:
          _0x5bb256['kind'] === 'character'
            ? normalizeStoryAssetNaturalVoiceDescription(_0x3b4308?.['voiceDescription'])
            : '',
        description: formatStoryAssetFactAndDesignDescription(_0x3b4308, _0x5bb256['description']),
        occurrences: normalizeText(_0x3b4308?.['occurrences']) || _0x5bb256['occurrences'],
        sourceChapterIds: _0x5bb256['sourceEpisodeRefs'],
        appearances: _0x5bb256['appearances']['map']((_0x2bb9e6) => {
          const _0x486b43 = _0xfde13c['get'](_0x2bb9e6['ref']);
          if (!_0x486b43)
            throw new Error('资产“' + _0x5bb256['name'] + '”缺少形象“' + _0x2bb9e6['ref'] + '”。');
          const _0x173916 = normalizeText(_0x486b43?.['prompt']);
          return {
            ..._0x486b43,
            ref: _0x2bb9e6['ref'],
            name: normalizeText(_0x486b43?.['name']) || _0x2bb9e6['name'],
            description: formatStoryAssetFactAndDesignDescription(_0x486b43, _0x2bb9e6['description']),
            occurrences: normalizeText(_0x486b43?.['occurrences']) || _0x2bb9e6['occurrences'],
            prompt: _0x173916,
            sourceChapterIds: _0x2bb9e6['sourceEpisodeRefs'],
          };
        }),
      };
    }),
    _0x15acfe = parseStoryAssetExtractionResult({ assets: _0x4d07ba }, { chapterIds: chapterIds });
  return _0x15acfe['assets']['map']((_0x70782e, _0x25bfe4) => {
    const _0x2b7ba9 = assetPlans[_0x25bfe4],
      _0xe77e89 = _0x4208e8['get'](_0x2b7ba9['ref']) || {},
      _0x416e2d = new Map(
        (Array['isArray'](_0xe77e89?.['appearances']) ? _0xe77e89['appearances'] : [])['map']((_0x50e403) => [
          normalizeReference(_0x50e403?.['ref']),
          _0x50e403,
        ]),
      ),
      _0x4a43a6 = _0x70782e['appearances']['map']((_0x2b292a, _0x17f01b) => {
        const _0xeb79d1 = _0x2b7ba9['appearances'][_0x17f01b],
          _0x432fab = _0x416e2d['get'](_0xeb79d1['ref']) || {};
        return {
          ..._0x2b292a,
          scriptFacts: normalizeText(_0x432fab?.['scriptFacts']),
          visualDesign: normalizeText(_0x432fab?.['visualDesign']),
          designStatus: 'ai-facts-plus-visual-completion',
          prompt: ensureStoryAssetVisualStyle(_0x2b292a['prompt'], visualStyle),
          sourceEpisodeRefs: _0xeb79d1['sourceEpisodeRefs'],
          sourceSceneRefs: _0xeb79d1['sourceSceneRefs'],
        };
      });
    return {
      ..._0x70782e,
      scriptFacts: normalizeText(_0xe77e89?.['scriptFacts']),
      visualDesign: normalizeText(_0xe77e89?.['visualDesign']),
      designStatus: 'ai-facts-plus-visual-completion',
      prompt: _0x4a43a6[0x0]?.['prompt'] || normalizeText(_0x70782e?.['prompt']),
      sourceEpisodeRefs: _0x2b7ba9['sourceEpisodeRefs'],
      sourceSceneRefs: _0x2b7ba9['sourceSceneRefs'],
      appearances: _0x4a43a6,
    };
  });
}
function formatStoryAssetFactAndDesignDescription(_0x23be4c = {}, _0x4848dd = '') {
  const _0x360eda = stripStoryAssetInternalEvidenceMetadata(_0x23be4c?.['scriptFacts']),
    _0x2b29ed = stripStoryAssetInternalEvidenceMetadata(_0x23be4c?.['visualDesign']),
    _0x48d529 = [_0x360eda ? '剧本事实：' + _0x360eda : '', _0x2b29ed ? '视觉补全：' + _0x2b29ed : ''][
      'filter'
    ](Boolean);
  return (
    _0x48d529['join']('\x0a') ||
    stripStoryAssetInternalEvidenceMetadata(_0x23be4c?.['description']) ||
    stripStoryAssetInternalEvidenceMetadata(_0x4848dd)
  );
}
function createCoverageError(_0x40e634) {
  const _0x2e73fe = _0x40e634['slice'](0x0, 0x3)
      ['map'](
        (_0x40605d) =>
          _0x40605d['type'] +
          ':' +
          _0x40605d['sourceSceneRef'] +
          (_0x40605d['expectedName'] ? ':' + _0x40605d['expectedName'] : ''),
      )
      ['join']('；'),
    _0x838ae2 = new Error('实验资产清单覆盖校验未通过：' + _0x2e73fe + '。');
  return ((_0x838ae2['validationDetails'] = { issues: _0x40e634 }), _0x838ae2);
}
const STORY_ASSET_EXTRACTION_DRAFT_STRATEGY = 'kind-compact-v7',
  STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY = 'evidence-batched-api-v2';
function createStoryAssetStructuredOutput(_0x32f810, _0xdd9694) {
  return { name: _0x32f810, schema: _0xdd9694, strict: !![], fallback: 'none' };
}
function createStoryAssetKindStructuredOutput(_0x2e7d05) {
  const _0x151c7a = normalizeStoryAssetKind(_0x2e7d05),
    _0x41bdd7 = { name: { type: 'string' } },
    _0x5f386c = ['name'];
  return (
    _0x151c7a === 'character' &&
      ((_0x41bdd7['role'] = { type: 'string', enum: ['主角', '配角', '反派', '路人'] }),
      _0x5f386c['push']('role')),
    _0x151c7a === 'scene' &&
      ((_0x41bdd7['sourceSceneRefs'] = { type: 'array', minItems: 0x2, items: { type: 'string' } }),
      _0x5f386c['push']('sourceSceneRefs')),
    createStoryAssetStructuredOutput('story_asset_' + _0x151c7a + '_compact_v7', {
      type: 'object',
      additionalProperties: ![],
      required: ['assets'],
      properties: {
        assets: {
          type: 'array',
          items: { type: 'object', additionalProperties: ![], required: _0x5f386c, properties: _0x41bdd7 },
        },
      },
    })
  );
}
function createStoryAssetInventoryStructuredOutput() {
  const _0x213c8e = {
    type: 'object',
    additionalProperties: ![],
    required: ['name', 'sourceSceneRefs'],
    properties: { name: { type: 'string' }, sourceSceneRefs: { type: 'array', items: { type: 'string' } } },
  };
  return createStoryAssetStructuredOutput('story_asset_inventory_v5', {
    type: 'object',
    additionalProperties: ![],
    required: ['assets', 'sceneAudits'],
    properties: {
      assets: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: ![],
          required: ['kind', 'name', 'role', 'sourceSceneRefs', 'appearances'],
          properties: {
            kind: { type: 'string', enum: STORY_ASSET_EXPERIMENTAL_KINDS },
            name: { type: 'string' },
            role: { type: 'string' },
            sourceSceneRefs: { type: 'array', items: { type: 'string' } },
            appearances: { type: 'array', items: _0x213c8e },
          },
        },
      },
      sceneAudits: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: ![],
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
    additionalProperties: ![],
    required: ['upserts', 'removeAssetRefs'],
    properties: {
      upserts: createStoryAssetInventoryStructuredOutput()['schema']['properties']['assets'],
      removeAssetRefs: { type: 'array', items: { type: 'string' } },
    },
  });
}
function createStoryAssetDetailStructuredOutput(_0x4029cd = 0x0, _0x31eab5 = []) {
  const _0x50b12f = Array['isArray'](_0x31eab5) ? _0x31eab5 : [],
    _0x4c8701 = normalizeStringArray(_0x50b12f['map']((_0x258e60) => _0x258e60?.['ref'])),
    _0x15346d = normalizeStringArray(
      _0x50b12f['flatMap']((_0xd20822) =>
        Array['isArray'](_0xd20822?.['appearances'])
          ? _0xd20822['appearances']['map']((_0x4ceefc) => _0x4ceefc?.['ref'])
          : [],
      ),
    );
  return createStoryAssetStructuredOutput('story_asset_detail_v5_' + (_0x4029cd + 0x1), {
    type: 'object',
    additionalProperties: ![],
    required: ['assets'],
    properties: {
      assets: {
        type: 'array',
        ...(_0x4c8701['length'] ? { minItems: _0x4c8701['length'], maxItems: _0x4c8701['length'] } : {}),
        items: {
          type: 'object',
          additionalProperties: ![],
          required: ['ref', 'scriptFacts', 'visualDesign', 'voiceDescription', 'appearances'],
          properties: {
            ref: _0x4c8701['length'] ? { type: 'string', enum: _0x4c8701 } : { type: 'string' },
            scriptFacts: { type: 'string' },
            visualDesign: { type: 'string' },
            voiceDescription: { type: 'string' },
            appearances: {
              type: 'array',
              minItems: 0x1,
              items: {
                type: 'object',
                additionalProperties: ![],
                required: ['ref', 'scriptFacts', 'visualDesign', 'prompt'],
                properties: {
                  ref: _0x15346d['length'] ? { type: 'string', enum: _0x15346d } : { type: 'string' },
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
function extractBalancedStoryAssetObjects(_0x44ba57, _0x21a54d = 'assets') {
  const _0x2221a1 = normalizeText(getResultText(_0x44ba57)),
    _0xf14701 = _0x2221a1['search'](
      new RegExp('(?:\x22' + _0x21a54d + '\x22|\x27' + _0x21a54d + "')\\s*:", 'u'),
    );
  if (_0xf14701 < 0x0) return [];
  const _0x29c4d1 = _0x2221a1['indexOf']('[', _0xf14701);
  if (_0x29c4d1 < 0x0) return [];
  const _0x44bba7 = [];
  let _0x5039e6 = -0x1,
    _0x210975 = 0x0,
    _0x3f09e9 = ![],
    _0x50480b = ![];
  for (let _0x319f09 = _0x29c4d1 + 0x1; _0x319f09 < _0x2221a1['length']; _0x319f09 += 0x1) {
    const _0xb7b13 = _0x2221a1[_0x319f09];
    if (_0x3f09e9) {
      if (_0x50480b) _0x50480b = ![];
      else {
        if (_0xb7b13 === '\x5c') _0x50480b = !![];
        else {
          if (_0xb7b13 === '\x22') _0x3f09e9 = ![];
        }
      }
      continue;
    }
    if (_0xb7b13 === '\x22') {
      _0x3f09e9 = !![];
      continue;
    }
    if (_0xb7b13 === '{') {
      if (_0x210975 === 0x0) _0x5039e6 = _0x319f09;
      _0x210975 += 0x1;
      continue;
    }
    if (_0xb7b13 === '}' && _0x210975 > 0x0) {
      _0x210975 -= 0x1;
      if (_0x210975 === 0x0 && _0x5039e6 >= 0x0) {
        try {
          _0x44bba7['push'](JSON['parse'](_0x2221a1['slice'](_0x5039e6, _0x319f09 + 0x1)));
        } catch {}
        _0x5039e6 = -0x1;
      }
    }
    if (_0xb7b13 === ']' && _0x210975 === 0x0) break;
  }
  return _0x44bba7;
}
function salvageStoryAssetInventoryResult(_0x241f7e, { sourceScenes: sourceScenes = [] } = {}) {
  const _0xb35068 = extractBalancedStoryAssetObjects(_0x241f7e, 'assets'),
    _0x52f612 = _0xb35068['flatMap']((_0x53c12b) => {
      try {
        return normalizeInventoryAssets([_0x53c12b], { sourceScenes: sourceScenes, allowEmpty: !![] });
      } catch {
        return [];
      }
    });
  if (!_0x52f612['length']) return null;
  const _0x251f91 = new Set();
  return (
    _0x52f612['forEach']((_0x5ddee4, _0x1007a6) => {
      _0x5ddee4['ref'] = createUniqueStoryAssetInventoryRef(
        _0x5ddee4['ref'],
        _0x251f91,
        'asset-' + (_0x1007a6 + 0x1),
      );
    }),
    {
      schemaVersion: STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION,
      assets: _0x52f612,
      sceneAudits: sourceScenes['map']((_0xe0aaaf) => ({
        sourceSceneRef: _0xe0aaaf['ref'],
        characterNames: normalizeStringArray(
          _0x52f612['filter'](
            (_0x80ec69) =>
              _0x80ec69['kind'] === 'character' && _0x80ec69['sourceSceneRefs']['includes'](_0xe0aaaf['ref']),
          )['map']((_0x352b23) => _0x352b23['name']),
        ),
        keyPropNames: normalizeStringArray(
          _0x52f612['filter'](
            (_0xf3d7ce) =>
              _0xf3d7ce['kind'] === 'prop' && _0xf3d7ce['sourceSceneRefs']['includes'](_0xe0aaaf['ref']),
          )['map']((_0x311d31) => _0x311d31['name']),
        ),
      })),
      salvaged: !![],
    }
  );
}
function parseStoryAssetInventoryResultWithSalvage(_0x171637, _0x259c69 = {}) {
  try {
    return parseStoryAssetInventoryResult(_0x171637, _0x259c69);
  } catch (_0x14bb43) {
    const _0x2d42c1 = salvageStoryAssetInventoryResult(_0x171637, _0x259c69);
    if (_0x2d42c1) return _0x2d42c1;
    throw _0x14bb43;
  }
}
function salvageStoryAssetDetailBatchResult(
  _0x418a6f,
  { assetPlans: assetPlans = [], chapterIds: chapterIds = [], visualStyle: visualStyle = '' } = {},
) {
  const _0x14b8ca = new Map(
      extractBalancedStoryAssetObjects(_0x418a6f, 'assets')['map']((_0x1d776d) => [
        normalizeReference(_0x1d776d?.['ref']),
        _0x1d776d,
      ]),
    ),
    _0x1b761a = [];
  return (
    assetPlans['forEach']((_0x56d6db) => {
      const _0x31e00c = _0x14b8ca['get'](_0x56d6db['ref']);
      if (!_0x31e00c) return;
      try {
        _0x1b761a['push'](
          ...parseStoryAssetDetailBatchResult(
            { assets: [_0x31e00c] },
            { assetPlans: [_0x56d6db], chapterIds: chapterIds, visualStyle: visualStyle },
          ),
        );
      } catch {}
    }),
    _0x1b761a
  );
}
export function splitDeterministicStorySceneAssetNames(_0x43682b = '') {
  const _0x4b2d53 = /(?:客厅|厨房|走廊|卧室|书房|餐厅|浴室|卫生间|阳台|玄关)$/u,
    _0xad7257 = normalizeText(_0x43682b)
      ['split'](/[/／|｜]+/u)
      ['map']((_0x294bf0) => normalizeStorySceneHeadingIdentity(_0x294bf0))
      ['filter'](Boolean),
    _0x164b54 = _0xad7257[0x0] || '',
    _0x56fd78 = _0x164b54['replace'](_0x4b2d53, ''),
    _0x3c6949 = [];
  return (
    _0xad7257['map']((_0x6bb73e, _0x2cd548) =>
      _0x2cd548 > 0x0 && _0x56fd78 && [..._0x6bb73e]['length'] <= 0x4 && _0x4b2d53['test'](_0x6bb73e)
        ? '' + _0x56fd78 + _0x6bb73e
        : _0x6bb73e,
    )['forEach']((_0x601624) => {
      const _0x5c819b = getStorySceneIdentityKey(_0x601624);
      _0x5c819b &&
        !_0x3c6949['some']((_0x1ed619) => getStorySceneIdentityKey(_0x1ed619) === _0x5c819b) &&
        _0x3c6949['push'](_0x601624);
    }),
    _0x3c6949
  );
}
function createDeterministicStoryAssetInventory({
  project: project = {},
  sourceScenes: sourceScenes = [],
} = {}) {
  const _0x548764 = (Array['isArray'](project?.['characters']) ? project['characters'] : [])['filter'](
      (_0x5e2bf4) => normalizeText(_0x5e2bf4?.['name']),
    ),
    _0x2deab7 = new Map();
  sourceScenes['forEach']((_0x1322c3) => {
    splitDeterministicStorySceneAssetNames(_0x1322c3['assetHeading'] || _0x1322c3['heading'])['forEach'](
      (_0x2ab3df) => {
        const _0x22f839 = getStorySceneIdentityKey(_0x2ab3df),
          _0x19cd82 = _0x2deab7['get'](_0x22f839) || { name: _0x2ab3df, sourceSceneRefs: [] };
        (_0x19cd82['sourceSceneRefs']['push'](_0x1322c3['ref']), _0x2deab7['set'](_0x22f839, _0x19cd82));
      },
    );
  });
  const _0x4618f0 = [];
  _0x548764['forEach']((_0x63d515, _0x3f36ce) => {
    const _0x51ad1f = normalizeText(_0x63d515['name']),
      _0x2c2080 = getStoryAssetNameAliases(_0x51ad1f),
      _0x197715 = sourceScenes['filter'](
        (_0x203412) =>
          _0x203412['characters']['some']((_0xac7c85) => storyCharacterNamesOverlap(_0x51ad1f, _0xac7c85)) ||
          _0x2c2080['some']((_0x454adf) => _0x203412['body']['includes'](_0x454adf)),
      )['map']((_0x2963e3) => _0x2963e3['ref']);
    if (!_0x197715['length']) return;
    const _0x4d1801 = 'local-character-' + (_0x3f36ce + 0x1);
    _0x4618f0['push']({
      ref: _0x4d1801,
      kind: 'character',
      name: _0x51ad1f,
      role: resolveStoryCharacterRole(_0x63d515?.['roleType'] || _0x63d515?.['role']),
      description: normalizeText(_0x63d515?.['profile'] || _0x63d515?.['fixedTraits']),
      sourceSceneRefs: normalizeStringArray(_0x197715),
      appearances: [
        {
          ref: _0x4d1801 + '-base',
          name: '基础形象',
          description: normalizeText(_0x63d515?.['fixedTraits']),
          sourceSceneRefs: normalizeStringArray(_0x197715),
        },
      ],
    });
  });
  const _0x5d1369 = createDeterministicStoryCharacterCandidateMap(sourceScenes);
  return (
    [..._0x5d1369['entries']()]['forEach'](([_0x2c001c, _0x247ebc], _0x42781d) => {
      const _0x35e3cf = 'local-source-character-' + (_0x42781d + 0x1),
        _0x53fe19 = normalizeStringArray(_0x247ebc['sourceSceneRefs']);
      _0x4618f0['push']({
        ref: _0x35e3cf,
        kind: 'character',
        name: _0x2c001c,
        role: '配角',
        description: '',
        sourceSceneRefs: _0x53fe19,
        appearances: [
          { ref: _0x35e3cf + '-base', name: '基础形象', description: '', sourceSceneRefs: _0x53fe19 },
        ],
      });
    }),
    [..._0x2deab7['values']()]['forEach']((_0x203cd9, _0x2743b8) => {
      const _0x26d40e = 'local-scene-' + (_0x2743b8 + 0x1);
      _0x4618f0['push']({
        ref: _0x26d40e,
        kind: 'scene',
        name: _0x203cd9['name'],
        role: '剧情场景',
        description: '',
        sourceSceneRefs: normalizeStringArray(_0x203cd9['sourceSceneRefs']),
        appearances: [
          {
            ref: _0x26d40e + '-base',
            name: '基础形象',
            description: '',
            sourceSceneRefs: normalizeStringArray(_0x203cd9['sourceSceneRefs']),
          },
        ],
      });
    }),
    createStoryAssetActionPropCandidates(sourceScenes)['forEach']((_0x537064, _0x5165dd) => {
      const _0x4d285b = 'local-action-prop-' + (_0x5165dd + 0x1);
      _0x4618f0['push']({
        ref: _0x4d285b,
        kind: 'prop',
        name: _0x537064['name'],
        role: '关键道具',
        description: '',
        sourceSceneRefs: normalizeStringArray(_0x537064['sourceSceneRefs']),
        appearances: [
          {
            ref: _0x4d285b + '-base',
            name: '基础形象',
            description: '',
            sourceSceneRefs: normalizeStringArray(_0x537064['sourceSceneRefs']),
          },
        ],
      });
    }),
    parseStoryAssetInventoryResult(
      {
        assets: _0x4618f0,
        sceneAudits: sourceScenes['map']((_0x416e61) => ({
          sourceSceneRef: _0x416e61['ref'],
          characterNames: [],
          keyPropNames: [],
        })),
      },
      { sourceScenes: sourceScenes },
    )
  );
}
function getStorySceneAssignmentScore(_0x2d73bb, _0x259aeb, _0x5312bf) {
  const _0x4f3562 = getStorySceneIdentityKey(_0x2d73bb?.['name']),
    _0x1a66b8 = getStorySceneIdentityKey(_0x259aeb?.['assetHeading'] || _0x259aeb?.['heading']),
    _0x43f19a = normalizeStringArray([
      ...(_0x259aeb?.['localEntityCandidates']?.['scene'] || []),
      ...(_0x259aeb?.['localEntityEvidence'] || [])
        ['filter']((_0x356372) => _0x356372?.['kind'] === 'scene')
        ['map']((_0x2a71ac) => _0x2a71ac?.['text']),
    ]);
  let _0x3464d2 = 0x0;
  if (_0x4f3562 && _0x4f3562 === _0x1a66b8) _0x3464d2 += 0x2710;
  if (_0x43f19a['some']((_0x4ec49c) => getStorySceneIdentityKey(_0x4ec49c) === _0x4f3562)) _0x3464d2 += 0x3e8;
  if (_0x4f3562 && _0x1a66b8 && storySceneIdentitiesOverlap(_0x4f3562, _0x1a66b8)) _0x3464d2 += 0x64;
  return (
    (_0x3464d2 -= Math['max'](0x0, normalizeStringArray(_0x2d73bb?.['sourceSceneRefs'])['length'] - 0x1)),
    { score: _0x3464d2, assetIndex: _0x5312bf }
  );
}
function getReusableStorySceneIdentityKey(_0x199509) {
  return normalizeStorySceneHeadingIdentity(_0x199509)
    ['replace'](/[（(](?:稍后|封锁|断电|电力|后半夜|窗边|紧接|紧随|细雨|雨天)[^）)]*[）)]\s*$/u, '')
    ['replace'](/宴会大厅/gu, '宴会厅')
    ['replace'](/集团(?:总部|大楼|大厦)/gu, '集团')
    ['replace'](/市区上空/gu, '市上空')
    ['toLowerCase']()
    ['replace'](/[^\p{L}\p{N}]+/gu, '');
}
function reconcileStorySceneAssetAssignments(_0x3c8717 = [], _0x1b98bf = [], _0x16bfe5 = []) {
  const _0x588cdd = _0x3c8717['filter']((_0x5232e0) => _0x5232e0?.['kind'] === 'scene'),
    _0x295ddf = new Map();
  return (
    _0x16bfe5['forEach']((_0x27c37b) => {
      const _0x5111d9 = _0x588cdd['map']((_0x365e04, _0x41654c) => ({
        asset: _0x365e04,
        assetIndex: _0x41654c,
      }))
        ['filter'](({ asset: _0x435ee4 }) =>
          normalizeStringArray(_0x435ee4?.['sourceSceneRefs'])['includes'](_0x27c37b['ref']),
        )
        ['map'](({ asset: _0x415978, assetIndex: _0x557f48 }) => ({
          asset: _0x415978,
          ...getStorySceneAssignmentScore(_0x415978, _0x27c37b, _0x557f48),
        }))
        ['sort'](
          (_0x28121e, _0x11876e) =>
            _0x11876e['score'] - _0x28121e['score'] || _0x28121e['assetIndex'] - _0x11876e['assetIndex'],
        );
      if (!_0x5111d9['length']) return;
      const _0x2fc745 = /[/／|｜]/u['test'](
          normalizeText(_0x27c37b?.['assetHeading'] || _0x27c37b?.['heading']),
        ),
        _0x5b462c = _0x2fc745
          ? _0x5111d9['map']((_0x307169) => _0x307169['asset'])['filter'](
              (_0x414f8e) => !/[/／|｜]/u['test'](normalizeText(_0x414f8e?.['name'])),
            )
          : [_0x5111d9[0x0]['asset']];
      if (_0x5b462c['length']) _0x295ddf['set'](_0x27c37b['ref'], new Set(_0x5b462c));
    }),
    _0x16bfe5['forEach']((_0x58b73d) => {
      if (_0x295ddf['has'](_0x58b73d['ref'])) return;
      const _0xfb1a8c = _0x1b98bf['filter'](
        (_0x23d086) =>
          _0x23d086?.['kind'] === 'scene' &&
          normalizeStringArray(_0x23d086?.['sourceSceneRefs'])['includes'](_0x58b73d['ref']),
      );
      if (!_0xfb1a8c['length']) return;
      const _0x5e6da1 = /[/／|｜]/u['test'](
          normalizeText(_0x58b73d?.['assetHeading'] || _0x58b73d?.['heading']),
        ),
        _0x42dd6f = _0x5e6da1
          ? _0xfb1a8c['filter']((_0x52df88) => !/[/／|｜]/u['test'](normalizeText(_0x52df88?.['name'])))
          : _0xfb1a8c['slice'](0x0, 0x1),
        _0xbc2128 = new Set();
      _0x42dd6f['forEach']((_0x1faf73) => {
        let _0x1b3da1 = _0x588cdd['find'](
          (_0x552e80) =>
            normalizeText(_0x552e80?.['name'])['toLowerCase']() ===
            normalizeText(_0x1faf73['name'])['toLowerCase'](),
        );
        (!_0x1b3da1 &&
          ((_0x1b3da1 = {
            ..._0x1faf73,
            sourceSceneRefs: [],
            appearances: _0x1faf73['appearances']
              ['slice'](0x0, 0x1)
              ['map']((_0x54ccca) => ({ ..._0x54ccca, sourceSceneRefs: [] })),
          }),
          _0x3c8717['push'](_0x1b3da1),
          _0x588cdd['push'](_0x1b3da1)),
          _0xbc2128['add'](_0x1b3da1));
      });
      if (_0xbc2128['size']) _0x295ddf['set'](_0x58b73d['ref'], _0xbc2128);
    }),
    _0x588cdd['forEach']((_0x240deb) => {
      const _0x2d8138 = _0x16bfe5['filter']((_0x1205d3) =>
        _0x295ddf['get'](_0x1205d3['ref'])?.['has'](_0x240deb),
      )['map']((_0x15261d) => _0x15261d['ref']);
      _0x240deb['sourceSceneRefs'] = normalizeStringArray(_0x2d8138);
      const _0x22116e = _0x240deb['appearances'][0x0] || {
        ref: _0x240deb['ref'] + '-base',
        name: '基础形象',
        description: '',
        sourceSceneRefs: [],
      };
      ((_0x240deb['appearances'] = (
        _0x240deb['appearances']['length'] ? _0x240deb['appearances'] : [_0x22116e]
      )['map']((_0x330b8e) => ({
        ..._0x330b8e,
        sourceSceneRefs: normalizeStringArray(_0x330b8e?.['sourceSceneRefs'])['filter']((_0x1f836d) =>
          _0x240deb['sourceSceneRefs']['includes'](_0x1f836d),
        ),
      }))),
        _0x240deb['sourceSceneRefs']['forEach']((_0x34121b) => {
          if (
            _0x240deb['appearances']['some']((_0x156384) =>
              _0x156384['sourceSceneRefs']['includes'](_0x34121b),
            )
          )
            return;
          _0x240deb['appearances'][0x0]['sourceSceneRefs']['push'](_0x34121b);
        }));
    }),
    _0x3c8717
  );
}
export function reconcileStoryAssetInventory(
  _0x567fb5 = {},
  { project: project = {}, sourceScenes: sourceScenes = [] } = {},
) {
  const _0x1e3dc2 = createDeterministicStoryAssetInventory({ project: project, sourceScenes: sourceScenes }),
    _0x166b7a = createDeterministicStoryCharacterCandidateMap(sourceScenes),
    _0x3fcaaf = getStoryAssetLocalCharacterCanonicalNames(sourceScenes),
    _0x34db1f = normalizeStringArray(
      (Array['isArray'](project?.['characters']) ? project['characters'] : [])['map'](
        (_0x59252f) => _0x59252f?.['name'],
      ),
    );
  _0x1e3dc2['assets'] = mergeStoryAssetInventoryResults(
    [
      {
        assets: _0x1e3dc2['assets']['map']((_0x5e1ad7) =>
          _0x5e1ad7?.['kind'] === 'character'
            ? {
                ..._0x5e1ad7,
                name:
                  resolveStoryProjectCharacterCanonicalName(_0x5e1ad7['name'], _0x34db1f) ||
                  resolveStoryAssetCharacterCanonicalName(_0x5e1ad7['name'], _0x166b7a, _0x3fcaaf),
              }
            : _0x5e1ad7,
        ),
        sceneAudits: [],
      },
    ],
    { sourceScenes: sourceScenes },
  )['assets'];
  const _0x31c7bb = new Set(
      _0x1e3dc2['assets']
        ['filter']((_0x771905) => normalizeText(_0x771905?.['ref'])['startsWith']('local-source-character-'))
        ['map']((_0x18cf12) => normalizeText(_0x18cf12?.['name'])['toLowerCase']()),
    ),
    _0x423148 = new Set(
      _0x1e3dc2['assets']
        ['filter']((_0x3739c6) => normalizeText(_0x3739c6?.['ref'])['startsWith']('local-action-prop-'))
        ['map']((_0x22506b) => normalizeText(_0x22506b?.['name'])['toLowerCase']()),
    ),
    _0x5d416b = (cloneStoryAssetExtractionValue(_0x567fb5?.['assets']) || [])
      ['filter']((_0x2ccd83) => {
        const _0x4eb7b9 = normalizeText(_0x2ccd83?.['ref']),
          _0x3fa3ac = normalizeText(_0x2ccd83?.['name'])['toLowerCase']();
        if (_0x4eb7b9['startsWith']('local-source-character-')) return _0x31c7bb['has'](_0x3fa3ac);
        if (_0x4eb7b9['startsWith']('local-action-prop-')) return _0x423148['has'](_0x3fa3ac);
        return !![];
      })
      ['flatMap']((_0x2c8d3) => {
        if (_0x2c8d3?.['kind'] === 'scene') {
          const _0x4ca695 = getReusableStorySceneIdentityKey(_0x2c8d3?.['name']),
            _0x104952 = normalizeStringArray(_0x2c8d3?.['sourceSceneRefs']),
            _0x380bef = (_0x54443b) =>
              _0x4ca695 &&
              _0x4ca695 ===
                getReusableStorySceneIdentityKey(_0x54443b?.['assetHeading'] || _0x54443b?.['heading']),
            _0x5b0a44 =
              sourceScenes['find'](
                (_0x507332) => _0x104952['includes'](_0x507332['ref']) && _0x380bef(_0x507332),
              ) || sourceScenes['find'](_0x380bef);
          if (!_0x5b0a44) return [_0x2c8d3];
          const _0x43cbe8 = new Set(
              sourceScenes['filter'](_0x380bef)['map']((_0x57b815) => _0x57b815['ref']),
            ),
            _0x24b7ec = _0x104952['filter']((_0x1d1777) => _0x43cbe8['has'](_0x1d1777));
          return [
            {
              ..._0x2c8d3,
              name: normalizeText(_0x5b0a44['assetHeading'] || _0x5b0a44['heading']),
              sourceSceneRefs: _0x24b7ec,
              appearances: _0x2c8d3['appearances']['map']((_0x28dc44) => ({
                ..._0x28dc44,
                sourceSceneRefs: normalizeStringArray(_0x28dc44?.['sourceSceneRefs'])['filter']((_0x42585a) =>
                  _0x43cbe8['has'](_0x42585a),
                ),
              })),
            },
          ];
        }
        if (_0x2c8d3?.['kind'] !== 'character') return [_0x2c8d3];
        const _0x12a480 = normalizeDeterministicStoryCharacterCandidate(_0x2c8d3?.['name']);
        if (!_0x12a480) return [];
        const _0x59fde1 =
          resolveStoryProjectCharacterCanonicalName(_0x12a480, _0x34db1f) ||
          resolveStoryAssetCharacterCanonicalName(_0x12a480, _0x166b7a, _0x3fcaaf);
        if (!_0x59fde1) return [];
        const _0x9fa345 = [..._0x166b7a['keys']()]['some']((_0x3250c3) =>
          storyCharacterNamesStronglyOverlap(_0x3250c3, _0x59fde1),
        );
        if (normalizeText(_0x2c8d3?.['ref'])['startsWith']('local-source-character-') && !_0x9fa345)
          return [];
        return [{ ..._0x2c8d3, name: _0x59fde1 }];
      }),
    _0x35c033 = mergeStoryAssetInventoryResults([{ assets: _0x5d416b, sceneAudits: [] }], {
      sourceScenes: sourceScenes,
    })['assets'],
    _0x32fedc = createStoryAssetCandidateLedger({
      sourceScenes: sourceScenes,
      authoritativeAssets: _0x1e3dc2['assets'],
      inventoryAssets: _0x35c033,
      sceneAudits: _0x567fb5?.['sceneAudits'],
    }),
    _0x4c52a6 = [];
  _0x35c033['forEach']((_0x571e9d) => {
    const _0x99b8c5 = _0x32fedc['reviewAsset'](_0x571e9d, { origin: 'inventory-asset' });
    if (_0x99b8c5['status'] !== 'promoted') return;
    if (_0x571e9d?.['kind'] !== 'character') {
      _0x4c52a6['push'](_0x571e9d);
      return;
    }
    const _0x2817cb = normalizeText(_0x571e9d?.['name']);
    if (!_0x2817cb) return;
    const _0x175a60 = _0x4c52a6['find'](
      (_0x419ce7) =>
        _0x419ce7['kind'] === 'character' && storyCharacterNamesStronglyOverlap(_0x419ce7['name'], _0x2817cb),
    );
    if (!_0x175a60) {
      _0x4c52a6['push'](_0x571e9d);
      return;
    }
    ((_0x175a60['role'] = resolveMergedStoryCharacterRole(_0x175a60['role'], _0x571e9d['role'])),
      (_0x175a60['description'] = _0x175a60['description'] || _0x571e9d['description']),
      (_0x175a60['sourceSceneRefs'] = normalizeStringArray([
        ..._0x175a60['sourceSceneRefs'],
        ..._0x571e9d['sourceSceneRefs'],
      ])),
      _0x571e9d['appearances']['forEach']((_0x18cc40) => {
        const _0x2e5a97 = _0x175a60['appearances']['find'](
          (_0xb5fa76) =>
            normalizeText(_0xb5fa76['name'])['toLowerCase']() ===
            normalizeText(_0x18cc40['name'])['toLowerCase'](),
        );
        _0x2e5a97
          ? mergeStoryAssetInventoryAppearance(_0x2e5a97, _0x18cc40)
          : _0x175a60['appearances']['push'](_0x18cc40);
      }));
  });
  const _0x911189 = new Map(
      (Array['isArray'](_0x567fb5?.['sceneAudits']) ? _0x567fb5['sceneAudits'] : [])['map']((_0x5d9254) => [
        _0x5d9254['sourceSceneRef'],
        {
          ..._0x5d9254,
          characterNames: normalizeStringArray(
            (_0x5d9254?.['characterNames'] || [])
              ['map'](
                (_0x2ffb40) =>
                  resolveStoryProjectCharacterCanonicalName(_0x2ffb40, _0x34db1f) ||
                  resolveStoryAssetCharacterCanonicalName(_0x2ffb40, _0x166b7a, _0x3fcaaf),
              )
              ['filter']((_0x57548d) =>
                ['absorbed', 'promoted']['includes'](
                  _0x32fedc['reviewAsset'](
                    { kind: 'character', name: _0x57548d, sourceSceneRefs: [_0x5d9254?.['sourceSceneRef']] },
                    { origin: 'inventory-audit' },
                  )['status'],
                ),
              ),
          ),
        },
      ]),
    ),
    _0x533c3b = (_0x58c65a, _0x119f98) =>
      _0x4c52a6['find'](
        (_0x28b4f4) =>
          _0x28b4f4['kind'] === _0x58c65a &&
          (_0x58c65a === 'character'
            ? storyCharacterNamesStronglyOverlap(_0x28b4f4['name'], _0x119f98)
            : normalizeText(_0x28b4f4['name'])['toLowerCase']() ===
              normalizeText(_0x119f98)['toLowerCase']()),
      );
  (_0x1e3dc2['assets']
    ['filter']((_0x649ca0) => _0x649ca0['kind'] === 'character')
    ['forEach']((_0xebb0cb) => {
      const _0x2faee6 = _0x533c3b('character', _0xebb0cb['name']);
      if (!_0x2faee6) {
        _0x4c52a6['push'](_0xebb0cb);
        return;
      }
      _0x2faee6['sourceSceneRefs'] = normalizeStringArray([
        ..._0x2faee6['sourceSceneRefs'],
        ..._0xebb0cb['sourceSceneRefs'],
      ]);
      const _0x5d09ba = _0x2faee6['appearances'][0x0] || _0xebb0cb['appearances'][0x0];
      _0x5d09ba['sourceSceneRefs'] = normalizeStringArray([
        ..._0x5d09ba['sourceSceneRefs'],
        ..._0xebb0cb['sourceSceneRefs']['filter'](
          (_0x10fb91) =>
            !_0x2faee6['appearances']['some']((_0x3fdffd) =>
              _0x3fdffd['sourceSceneRefs']['includes'](_0x10fb91),
            ),
        ),
      ]);
      if (!_0x2faee6['appearances']['length']) _0x2faee6['appearances'] = [_0x5d09ba];
    }),
    _0x1e3dc2['assets']
      ['filter']((_0x22ff24) => _0x22ff24['kind'] === 'prop')
      ['forEach']((_0x57f2ee) => {
        const _0x191f72 = _0x533c3b('prop', _0x57f2ee['name']);
        if (!_0x191f72) {
          _0x4c52a6['push'](_0x57f2ee);
          return;
        }
        _0x191f72['sourceSceneRefs'] = normalizeStringArray([
          ..._0x191f72['sourceSceneRefs'],
          ..._0x57f2ee['sourceSceneRefs'],
        ]);
        const _0x5d4013 = _0x191f72['appearances'][0x0] || _0x57f2ee['appearances'][0x0];
        _0x5d4013['sourceSceneRefs'] = normalizeStringArray([
          ..._0x5d4013['sourceSceneRefs'],
          ..._0x57f2ee['sourceSceneRefs'],
        ]);
        if (!_0x191f72['appearances']['length']) _0x191f72['appearances'] = [_0x5d4013];
      }));
  const _0x3ce638 = (_0x4133ec, _0x5aaecd, _0x574ee6) => {
    if (!_0x5aaecd || !_0x574ee6) return;
    const _0x2c15bb = _0x32fedc['reviewAsset'](
      { kind: _0x4133ec, name: _0x5aaecd, sourceSceneRefs: [_0x574ee6] },
      { origin: 'inventory-audit' },
    );
    if (!['absorbed', 'promoted']['includes'](_0x2c15bb['status'])) return;
    let _0x3d0216 = _0x533c3b(_0x4133ec, _0x5aaecd);
    if (!_0x3d0216 && _0x2c15bb['status'] === 'promoted') {
      const _0x525454 = 'evidence-' + _0x4133ec + '-' + (_0x4c52a6['length'] + 0x1);
      ((_0x3d0216 = {
        ref: _0x525454,
        kind: _0x4133ec,
        name: normalizeText(_0x5aaecd),
        role: _0x4133ec === 'character' ? '配角' : '关键道具',
        description: '',
        sourceSceneRefs: [],
        appearances: [{ ref: _0x525454 + '-base', name: '基础形象', description: '', sourceSceneRefs: [] }],
      }),
        _0x4c52a6['push'](_0x3d0216));
    }
    if (!_0x3d0216) return;
    _0x3d0216['sourceSceneRefs'] = normalizeStringArray([..._0x3d0216['sourceSceneRefs'], _0x574ee6]);
    const _0x1fbc7e = _0x3d0216['appearances']['find']((_0x1770b0) =>
      _0x1770b0['sourceSceneRefs']['includes'](_0x574ee6),
    );
    !_0x1fbc7e &&
      _0x3d0216['appearances'][0x0] &&
      (_0x3d0216['appearances'][0x0]['sourceSceneRefs'] = normalizeStringArray([
        ..._0x3d0216['appearances'][0x0]['sourceSceneRefs'],
        _0x574ee6,
      ]));
  };
  (_0x911189['forEach']((_0x33fb9, _0x39b1b9) => {
    (normalizeStringArray(_0x33fb9?.['characterNames'])['forEach']((_0x14f9ea) => {
      _0x3ce638('character', _0x14f9ea, _0x39b1b9);
    }),
      normalizeStringArray(_0x33fb9?.['keyPropNames'])['forEach']((_0x3434f9) => {
        _0x3ce638('prop', _0x3434f9, _0x39b1b9);
      }));
  }),
    reconcileStorySceneAssetAssignments(_0x4c52a6, _0x1e3dc2['assets'], sourceScenes));
  const _0x175f50 = _0x4c52a6['filter']((_0x1ef382) => _0x1ef382['sourceSceneRefs']['length']);
  _0x175f50['forEach']((_0x28d22f) => {
    (_0x28d22f['sourceSceneRefs']['forEach']((_0x21f733) => {
      const _0x5a1281 = _0x28d22f['appearances']['filter']((_0x4ade95) =>
        _0x4ade95['sourceSceneRefs']['includes'](_0x21f733),
      );
      if (!_0x5a1281['length']) _0x28d22f['appearances'][0x0]['sourceSceneRefs']['push'](_0x21f733);
      _0x28d22f['kind'] !== 'scene' &&
        _0x5a1281['slice'](0x1)['forEach']((_0x409996) => {
          _0x409996['sourceSceneRefs'] = _0x409996['sourceSceneRefs']['filter'](
            (_0x44d81d) => _0x44d81d !== _0x21f733,
          );
        });
    }),
      _0x28d22f['appearances']['forEach']((_0x23e8ec) => {
        _0x23e8ec['sourceSceneRefs'] = normalizeStringArray(_0x23e8ec['sourceSceneRefs']);
      }));
  });
  const _0x2909a5 = new Set(),
    _0x1130d3 = new Set();
  _0x175f50['forEach']((_0x401aea, _0x23ca66) => {
    ((_0x401aea['ref'] = createUniqueStoryAssetInventoryRef(
      _0x401aea['ref'],
      _0x2909a5,
      'asset-' + (_0x23ca66 + 0x1),
    )),
      _0x401aea['appearances']['forEach']((_0x385e20, _0x3a4efa) => {
        _0x385e20['ref'] = createUniqueStoryAssetAppearanceRef(
          _0x385e20['ref'],
          _0x1130d3,
          _0x401aea['ref'] + '-appearance-' + (_0x3a4efa + 0x1),
        );
      }));
  });
  const _0x51a434 = new Set(
      _0x175f50['filter']((_0x20f175) => _0x20f175['kind'] === 'prop')['map'](
        (_0x3f3bb3) => _0x3f3bb3['name'],
      ),
    ),
    _0x5b4d8d = parseStoryAssetInventoryResult(
      {
        assets: _0x175f50,
        sceneAudits: sourceScenes['map']((_0x1d62ae) => ({
          sourceSceneRef: _0x1d62ae['ref'],
          characterNames: normalizeStringArray(
            _0x175f50['filter'](
              (_0x305b9b) =>
                _0x305b9b['kind'] === 'character' &&
                _0x305b9b['sourceSceneRefs']['includes'](_0x1d62ae['ref']),
            )['map']((_0x53b34d) => _0x53b34d['name']),
          ),
          keyPropNames: normalizeStringArray([
            ...(_0x911189['get'](_0x1d62ae['ref'])?.['keyPropNames'] || [])['filter']((_0x4d1a06) =>
              _0x51a434['has'](_0x4d1a06),
            ),
            ..._0x175f50['filter'](
              (_0x23f51d) =>
                _0x23f51d['kind'] === 'prop' && _0x23f51d['sourceSceneRefs']['includes'](_0x1d62ae['ref']),
            )['map']((_0x94037a) => _0x94037a['name']),
          ]),
        })),
      },
      { sourceScenes: sourceScenes },
    );
  return { ..._0x5b4d8d, candidateLedger: _0x32fedc['snapshot']() };
}
const STORY_ASSET_KIND_LABELS = Object['freeze']({ character: '角色', scene: '场景', prop: '道具' });
function normalizeStoryAssetKind(_0x47b623) {
  const _0x14db29 = normalizeText(_0x47b623);
  if (!STORY_ASSET_EXPERIMENTAL_KINDS['includes'](_0x14db29))
    throw new Error('资产提取不支持类型“' + (_0x14db29 || '未指定') + '”。');
  return _0x14db29;
}
function buildStoryAssetKindSystemPrompt(_0x2533f9) {
  const _0x888b63 = normalizeStoryAssetKind(_0x2533f9),
    _0x789186 = STORY_ASSET_KIND_LABELS[_0x888b63],
    _0x23048b =
      _0x888b63 === 'character'
        ? '每项只能包含 name 和 role'
        : _0x888b63 === 'scene'
          ? '每项只能包含 name 和 sourceSceneRefs'
          : '每项只能包含 name';
  return [
    '你是专业的影视' + _0x789186 + '资产提取 Agent。',
    _0x888b63 === 'scene'
      ? '本次只返回需要合并的重复场景组；只出现一次的唯一场景禁止返回。'
      : '本次只提取全部' + _0x789186 + '，禁止返回其他类型的资产。',
    ...(_0x888b63 === 'scene'
      ? ['必须从第一场到最后一场完整扫描全部重复关系，所有重复组都要返回，不得遗漏。']
      : []),
    '输入包含完整分集剧本，只把它作为识别与视觉设定依据，不续写剧情，不生成分镜。',
    '输出必须极短：' + _0x23048b + '。',
    '禁止返回 description、提示词、形象列表、声音、出现范围、章节、解释、Markdown 或契约外字段。',
    '只返回一个 JSON 对象，顶层只能包含 assets 数组。',
  ]['join']('\x0a');
}
function buildStoryAssetKindOutputSchema(_0x3d6185) {
  if (_0x3d6185 === 'character')
    return { assets: [{ name: '角色姓名或不超过 6 个汉字的身份短称', role: '主角、配角、反派或路人' }] };
  return {
    assets: [
      {
        name: _0x3d6185 === 'scene' ? '场景名称及必要的视觉状态' : '关键道具名称',
        ...(_0x3d6185 === 'scene' ? { sourceSceneRefs: ['sourceScenes[].ref'] } : {}),
      },
    ],
  };
}
function buildStoryAssetKindRequirements(_0x245739, _0x534868 = '') {
  const _0x553628 =
      _0x245739 === 'character'
        ? 'name 和 role'
        : _0x245739 === 'scene'
          ? 'name\x20和\x20sourceSceneRefs'
          : 'name',
    _0x3863ba = [
      '本轮必须阅读全部 sourceScenes，但 assets 中只能返回 assetKind 指定的一种资产。',
      'storyContext.characters[].fixedTraits 与 continuityFacts 是已确认约束，不得为了视觉效果改写。',
      '每项只能返回\x20' + _0x553628 + '；其余信息全部由客户端补齐。',
      '不要为了满足数量而虚构资产；确实没有该类资产时返回\x20{\x22assets\x22:[]}。',
    ];
  if (_0x245739 === 'character')
    _0x3863ba['push'](
      '提取需要保持人物外观一致的真实角色；动作短语、台词引导语、评论区、记者群等泛称不得当作具名角色。',
      'role\x20只能是主角、配角、反派或路人。',
      '每项只返回 name 和 role；禁止返回人物描述。',
    );
  else
    _0x245739 === 'scene'
      ? _0x3863ba['push'](
          'assets\x20只列重复场景合并组；每组必须包含至少两个\x20sourceScenes[].ref，唯一场景由客户端本地补齐。',
          '先只扫描\x20sceneHeadingIndex\x20完成地点聚类，再结合\x20sourceScenes\x20正文消歧；必须穷尽全部重复组，不能只合并字面完全相同的标题。',
          '同一物理空间因简称、所属人或机构前缀、日夜、稍后、紧接、后半夜、窗边、天气、镜头位置、封锁或断电等标题变体应合并。',
          '同义空间词和组织简称也视为同一地点，例如宴会厅/宴会大厅、总部/集团大楼/大厦、都市报社/滨海都市报、临时避难室/避难室。',
          '人物住所的泛称与具体房间名在正文确认相同时应合并，例如旧楼/老楼单间/租处；空间状态后缀也不能制造新场景，例如废墟旁广场/广场。',
          '标题写同地点、原地、旁边或仅写状态时，必须结合相邻 sourceScenes 和正文解析其真实地点后归入对应重复组。',
          '不同房间、入口与室内、地面与天台、物理空间与意识/梦境/回忆空间、完好建筑与结构性废墟不得合并。',
          '同一个 sourceScenes[].ref 最多出现在一个重复组中；sourceSceneRefs 只能引用真实 ref。',
          'name 使用去掉时间、转场和镜头位置修饰后的稳定场景名称，并且必须能与组内每个标题的地点身份对应。',
        )
      : _0x3863ba['push'](
          '只提取跨镜头需要保持视觉一致的剧情关键道具，不提取普通背景杂物、一次性食物或无叙事作用的小物件。',
          '每项只返回 name；禁止返回道具描述。',
        );
  return _0x3863ba;
}
export function buildStoryAssetKindExtractionPrompt({
  project: project = {},
  episodes: episodes = [],
  sourceScenes: sourceScenes = null,
  kind: kind = 'character',
  batchIndex: batchIndex = 0x0,
  batchCount: batchCount = 0x1,
  aspectRatio: aspectRatio = '',
  visualStyle: visualStyle = '',
} = {}) {
  const _0x13a18a = normalizeStoryAssetKind(kind),
    _0x55e861 = normalizeStoryContext(project),
    _0x292a63 = Array['isArray'](sourceScenes)
      ? sourceScenes
      : normalizeStoryAssetExtractionSources(episodes);
  if (!_0x292a63['length']) throw new Error('资产提取缺少可用的场次正文。');
  const _0x4ad86e = _0x292a63['map']((_0x51787c) => ({
      ref: _0x51787c['ref'],
      heading: _0x51787c['heading'],
      characters: _0x51787c['characters'],
      body: _0x51787c['body'],
    })),
    _0x41c639 =
      _0x13a18a === 'scene'
        ? _0x292a63['map']((_0xdc0b56, _0x46d715) => ({
            ref: _0xdc0b56['ref'],
            heading: _0xdc0b56['heading'],
            ...(_0x46d715 > 0x0
              ? {
                  previousRef: _0x292a63[_0x46d715 - 0x1]['ref'],
                  previousHeading: _0x292a63[_0x46d715 - 0x1]['heading'],
                }
              : {}),
          }))
        : undefined;
  return JSON['stringify']({
    task: 'extract_story_assets_by_kind',
    schemaVersion: STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION,
    assetKind: _0x13a18a,
    storyContext: {
      title: _0x55e861['title'],
      summary: _0x55e861['summary'],
      setting: _0x55e861['setting'],
      continuityFacts: _0x55e861['continuityFacts'],
      ...(_0x13a18a === 'character' ? { characters: _0x55e861['characters'] } : {}),
    },
    ...(_0x41c639 ? { sceneHeadingIndex: _0x41c639 } : {}),
    sourceScenes: _0x4ad86e,
    requirements: buildStoryAssetKindRequirements(_0x13a18a),
  });
}
function inferStoryAssetSourceSceneRefs(_0x25d19f, _0x35680d, _0x19474c = []) {
  const _0x5c469b = normalizeText(_0x35680d);
  if (!_0x5c469b) return [];
  const _0x57a865 = _0x5c469b['split'](/[_＿|｜·•]/u)[0x0]['trim'](),
    _0x102d0c = getStoryAssetNameAliases(_0x5c469b);
  return _0x19474c['filter']((_0x29be87) => {
    if (_0x25d19f === 'character')
      return (
        _0x29be87['characters']['some']((_0x4fbcb4) => storyCharacterNamesOverlap(_0x4fbcb4, _0x5c469b)) ||
        _0x102d0c['some']((_0x530de4) => _0x29be87['body']['includes'](_0x530de4))
      );
    if (_0x25d19f === 'scene')
      return (
        _0x29be87['heading']['includes'](_0x5c469b) ||
        (_0x57a865['length'] >= 0x2 && _0x29be87['heading']['includes'](_0x57a865))
      );
    return _0x29be87['body']['includes'](_0x5c469b);
  })['map']((_0x381d13) => _0x381d13['ref']);
}
function resolveStoryAssetSourceChapterIds({
  sourceSceneRefs: sourceSceneRefs = [],
  sourceEpisodeRefs: sourceEpisodeRefs = [],
  sourceScenes: sourceScenes = [],
  chapterIds: chapterIds = [],
} = {}) {
  const _0x43aea3 = new Set(normalizeStringArray(chapterIds)),
    _0x31f3c1 = new Map(sourceScenes['map']((_0x282219) => [_0x282219['ref'], _0x282219])),
    _0x2c4c9d = new Map();
  sourceScenes['forEach']((_0x4c0776) => {
    if (_0x2c4c9d['has'](_0x4c0776['episodeRef'])) return;
    const _0x45ea6d = _0x43aea3['has'](_0x4c0776['episodeRef'])
      ? _0x4c0776['episodeRef']
      : normalizeText(chapterIds[Math['max'](0x0, _0x4c0776['episodeNumber'] - 0x1)]);
    if (_0x45ea6d) _0x2c4c9d['set'](_0x4c0776['episodeRef'], _0x45ea6d);
  });
  const _0x234637 = normalizeStringArray([
    ...sourceEpisodeRefs,
    ...sourceSceneRefs['map']((_0x4401df) => _0x31f3c1['get'](_0x4401df)?.['episodeRef']),
  ]);
  return normalizeStringArray(
    _0x234637['map'](
      (_0x1f75b7) => _0x2c4c9d['get'](_0x1f75b7) || (_0x43aea3['has'](_0x1f75b7) ? _0x1f75b7 : ''),
    ),
  );
}
function ensureStoryAssetVisualStyle(_0x31a698, _0x4056a3 = '') {
  const _0x1c2d5b = sanitizeStoryAssetPublicPromptText(_0x31a698),
    _0x7e1487 = sanitizeStoryAssetPublicPromptText(_0x4056a3);
  if (!_0x7e1487 || _0x1c2d5b['startsWith'](_0x7e1487)) return _0x1c2d5b;
  return _0x7e1487 + '\x0a' + _0x1c2d5b;
}
function resolveStoryCharacterRole(_0x440a3a) {
  return normalizeStoryAssetFinalCharacterRole(_0x440a3a);
}
function getStoryAssetKindRawAssets(_0x15b112, _0x1b585e) {
  const _0x48963d = getResultText(_0x15b112);
  if (Array['isArray'](_0x48963d)) return _0x48963d;
  const _0x4ea3bd = parseStrictJson(
    _0x48963d,
    'Agent\x20未返回' + STORY_ASSET_KIND_LABELS[_0x1b585e] + '提取结果。',
  );
  if (Array['isArray'](_0x4ea3bd)) return _0x4ea3bd;
  const _0x2db8ba =
      _0x1b585e === 'character'
        ? [_0x4ea3bd?.['characters'], _0x4ea3bd?.['assets']]
        : _0x1b585e === 'scene'
          ? [_0x4ea3bd?.['scenes'], _0x4ea3bd?.['assets']]
          : [_0x4ea3bd?.['props'], _0x4ea3bd?.['assets']],
    _0x555125 = _0x2db8ba['find'](Array['isArray']);
  if (!_0x555125)
    throw new Error('Agent 返回的' + STORY_ASSET_KIND_LABELS[_0x1b585e] + '结果缺少 assets 数组。');
  return _0x555125;
}
function mergeStoryAssetKindResultAssets(_0x15ec86 = []) {
  const _0x551f28 = [],
    _0x253c61 = new Map();
  return (
    _0x15ec86['forEach']((_0x21323d) => {
      const _0x4435f4 = normalizeText(_0x21323d?.['name'])['toLowerCase']();
      if (!_0x4435f4) return;
      const _0x1670c3 = _0x253c61['get'](_0x4435f4);
      if (!_0x1670c3) {
        (_0x253c61['set'](_0x4435f4, _0x21323d), _0x551f28['push'](_0x21323d));
        return;
      }
      ((_0x1670c3['description'] ||= _0x21323d['description']),
        (_0x1670c3['voiceDescription'] ||= _0x21323d['voiceDescription']),
        (_0x1670c3['occurrences'] ||= _0x21323d['occurrences']),
        (_0x1670c3['sourceEpisodeRefs'] = normalizeStringArray([
          ..._0x1670c3['sourceEpisodeRefs'],
          ..._0x21323d['sourceEpisodeRefs'],
        ])),
        (_0x1670c3['sourceSceneRefs'] = normalizeStringArray([
          ..._0x1670c3['sourceSceneRefs'],
          ..._0x21323d['sourceSceneRefs'],
        ])));
      const _0x1ca0e8 = new Map(
        _0x1670c3['appearances']['map']((_0x27083c) => [
          normalizeText(_0x27083c['name'])['toLowerCase'](),
          _0x27083c,
        ]),
      );
      (_0x21323d['appearances']['forEach']((_0x567c48) => {
        const _0x119fa6 = normalizeText(_0x567c48['name'])['toLowerCase'](),
          _0x5ad0ad = _0x1ca0e8['get'](_0x119fa6);
        if (!_0x5ad0ad) {
          (_0x1670c3['appearances']['push'](_0x567c48), _0x1ca0e8['set'](_0x119fa6, _0x567c48));
          return;
        }
        ((_0x5ad0ad['description'] ||= _0x567c48['description']),
          (_0x5ad0ad['prompt'] ||= _0x567c48['prompt']),
          (_0x5ad0ad['occurrences'] ||= _0x567c48['occurrences']),
          (_0x5ad0ad['sourceEpisodeRefs'] = normalizeStringArray([
            ..._0x5ad0ad['sourceEpisodeRefs'],
            ..._0x567c48['sourceEpisodeRefs'],
          ])),
          (_0x5ad0ad['sourceSceneRefs'] = normalizeStringArray([
            ..._0x5ad0ad['sourceSceneRefs'],
            ..._0x567c48['sourceSceneRefs'],
          ])),
          (_0x5ad0ad['sourceChapterIds'] = normalizeStringArray([
            ..._0x5ad0ad['sourceChapterIds'],
            ..._0x567c48['sourceChapterIds'],
          ])));
      }),
        (_0x1670c3['sourceChapterIds'] = normalizeStringArray([
          ..._0x1670c3['sourceChapterIds'],
          ..._0x21323d['sourceChapterIds'],
        ])));
    }),
    _0x551f28
  );
}
function normalizeStorySceneAssetsForCoverage(
  _0x402156 = [],
  { sourceScenes: sourceScenes = [], chapterIds: chapterIds = [], visualStyle: visualStyle = '' } = {},
) {
  if (!sourceScenes['length']) return _0x402156;
  const _0x19dcb0 = new Map(sourceScenes['map']((_0x588bf9, _0x580ebe) => [_0x588bf9['ref'], _0x580ebe])),
    _0x33b539 = /^(?:(?:同地点|同一地点|同一处|原地|此处|该处|这里|旁边)(?:\s|$|[（(])|.+(?:旁|附近|周围)$)/u,
    _0x5a76a3 = (_0x82c041, _0x23a584) => {
      const _0x1e13a7 = getReusableStorySceneIdentityKey(_0x82c041),
        _0x2f56a5 = getReusableStorySceneIdentityKey(_0x23a584);
      return Boolean(_0x1e13a7 && _0x1e13a7 === _0x2f56a5);
    },
    _0x581417 = (_0x168ffe, _0x2ebf26) => {
      if (storySceneIdentitiesOverlap(_0x168ffe?.['name'], _0x2ebf26?.['heading'])) return !![];
      const _0x1c70a4 = normalizeStorySceneHeadingIdentity(_0x2ebf26?.['heading']);
      if (!_0x33b539['test'](_0x1c70a4)) return ![];
      const _0x4cbb0d = _0x19dcb0['get'](_0x2ebf26['ref']),
        _0x15131a = _0x4cbb0d > 0x0 ? sourceScenes[_0x4cbb0d - 0x1]?.['ref'] : '';
      return Boolean(
        _0x15131a && normalizeStringArray(_0x168ffe?.['sourceSceneRefs'])['includes'](_0x15131a),
      );
    },
    _0x2b7dcb = new Map(),
    _0x4b0e91 = [];
  sourceScenes['forEach']((_0x1671ec) => {
    const _0x139dfc = _0x402156['map']((_0x5e4012, _0x52111a) => ({
        asset: _0x5e4012,
        assetIndex: _0x52111a,
        explicitlyBound: normalizeStringArray(_0x5e4012?.['sourceSceneRefs'])['includes'](_0x1671ec['ref']),
        hasExplicitBindings: normalizeStringArray(_0x5e4012?.['sourceSceneRefs'])['length'] > 0x0,
      }))
        ['filter'](
          ({ asset: _0x32cac1, explicitlyBound: _0x57f271, hasExplicitBindings: _0x11e533 }) =>
            (!_0x11e533 || _0x57f271) &&
            (_0x57f271
              ? _0x581417(_0x32cac1, _0x1671ec)
              : storySceneIdentitiesOverlap(_0x32cac1?.['name'], _0x1671ec?.['heading'])),
        )
        ['sort'](
          (_0x56a79e, _0x163e81) =>
            Number(_0x163e81['explicitlyBound']) - Number(_0x56a79e['explicitlyBound']) ||
            normalizeStringArray(_0x56a79e['asset']?.['sourceSceneRefs'])['length'] -
              normalizeStringArray(_0x163e81['asset']?.['sourceSceneRefs'])['length'],
        ),
      _0xd0cef8 = _0x139dfc[0x0];
    if (!_0xd0cef8) {
      _0x4b0e91['push'](_0x1671ec);
      return;
    }
    const _0x57dca5 = _0x2b7dcb['get'](_0xd0cef8['assetIndex']) || [];
    (_0x57dca5['push'](_0x1671ec), _0x2b7dcb['set'](_0xd0cef8['assetIndex'], _0x57dca5));
  });
  const _0x4002a0 = [..._0x2b7dcb['entries']()]['map'](([_0x30c0af, _0x2fad30]) => {
    const _0x2da613 = _0x402156[_0x30c0af],
      _0x2528f2 = _0x2fad30['map']((_0x13510a) => _0x13510a['ref']),
      _0x105e08 = deriveSourceEpisodeRefs(
        _0x2528f2,
        new Map(sourceScenes['map']((_0x39dffa) => [_0x39dffa['ref'], _0x39dffa])),
      ),
      _0x195d08 = resolveStoryAssetSourceChapterIds({
        sourceSceneRefs: _0x2528f2,
        sourceEpisodeRefs: _0x105e08,
        sourceScenes: sourceScenes,
        chapterIds: chapterIds,
      }),
      _0x4d29fb = (Array['isArray'](_0x2da613?.['appearances']) ? _0x2da613['appearances'] : [])['map'](
        (_0x45feed) => ({
          ..._0x45feed,
          occurrences: buildOccurrences(_0x105e08),
          sourceChapterIds: _0x195d08,
          sourceEpisodeRefs: _0x105e08,
          sourceSceneRefs: _0x2528f2,
        }),
      );
    return {
      ..._0x2da613,
      occurrences: buildOccurrences(_0x105e08),
      sourceChapterIds: _0x195d08,
      sourceEpisodeRefs: _0x105e08,
      sourceSceneRefs: _0x2528f2,
      appearances: _0x4d29fb,
    };
  });
  return (
    _0x4b0e91['forEach']((_0x146d4a, _0x3ce56c) => {
      const _0x405286 = _0x4002a0['find']((_0x106333) =>
        _0x5a76a3(_0x106333?.['name'], _0x146d4a?.['heading']),
      );
      if (_0x405286) {
        ((_0x405286['sourceSceneRefs'] = normalizeStringArray([
          ..._0x405286['sourceSceneRefs'],
          _0x146d4a['ref'],
        ])),
          (_0x405286['sourceEpisodeRefs'] = deriveSourceEpisodeRefs(
            _0x405286['sourceSceneRefs'],
            new Map(sourceScenes['map']((_0x2a619c) => [_0x2a619c['ref'], _0x2a619c])),
          )),
          (_0x405286['sourceChapterIds'] = resolveStoryAssetSourceChapterIds({
            sourceSceneRefs: _0x405286['sourceSceneRefs'],
            sourceEpisodeRefs: _0x405286['sourceEpisodeRefs'],
            sourceScenes: sourceScenes,
            chapterIds: chapterIds,
          })),
          (_0x405286['occurrences'] = buildOccurrences(_0x405286['sourceEpisodeRefs'])));
        const _0x333b4e = _0x405286['appearances'][0x0];
        _0x333b4e &&
          ((_0x333b4e['sourceSceneRefs'] = [..._0x405286['sourceSceneRefs']]),
          (_0x333b4e['sourceEpisodeRefs'] = [..._0x405286['sourceEpisodeRefs']]),
          (_0x333b4e['sourceChapterIds'] = [..._0x405286['sourceChapterIds']]),
          (_0x333b4e['occurrences'] = _0x405286['occurrences']));
        return;
      }
      const _0x57762b =
          normalizeStorySceneHeadingIdentity(_0x146d4a?.['heading']) || '场景 ' + (_0x3ce56c + 0x1),
        _0x23d500 = [_0x146d4a['ref']],
        _0x2bb7db = deriveSourceEpisodeRefs(
          _0x23d500,
          new Map(sourceScenes['map']((_0x5b3c96) => [_0x5b3c96['ref'], _0x5b3c96])),
        ),
        _0x1f3bf6 = resolveStoryAssetSourceChapterIds({
          sourceSceneRefs: _0x23d500,
          sourceEpisodeRefs: _0x2bb7db,
          sourceScenes: sourceScenes,
          chapterIds: chapterIds,
        }),
        _0x2f46f6 = [
          normalizeText(_0x146d4a?.['heading']),
          stripStoryAssetInternalEvidenceMetadata(_0x146d4a?.['body'])['slice'](0x0, 0xb4),
        ]
          ['filter'](Boolean)
          ['join']('；'),
        _0x29b105 = normalizeReference('', 'scene-coverage-' + (_0x4002a0['length'] + _0x3ce56c + 0x1)),
        _0x564b9e = ensureStoryAssetVisualStyle(
          _0x57762b + '，' + (_0x2f46f6 || '依据原文建立的剧情空间') + '，影视场景设定图，默认无人',
          visualStyle,
        );
      _0x4002a0['push']({
        ref: _0x29b105,
        kind: 'scene',
        name: _0x57762b,
        role: '剧情场景',
        description: _0x2f46f6,
        voiceDescription: '',
        occurrences: buildOccurrences(_0x2bb7db),
        sourceChapterIds: _0x1f3bf6,
        sourceEpisodeRefs: _0x2bb7db,
        sourceSceneRefs: _0x23d500,
        appearances: [
          {
            ref: _0x29b105 + '-appearance-1',
            name: '基础形象',
            description: _0x2f46f6,
            occurrences: buildOccurrences(_0x2bb7db),
            sourceChapterIds: _0x1f3bf6,
            sourceEpisodeRefs: _0x2bb7db,
            sourceSceneRefs: _0x23d500,
            prompt: _0x564b9e,
          },
        ],
      });
    }),
    _0x4002a0
  );
}
export function parseStoryAssetKindExtractionResult(
  _0x383a7b,
  {
    kind: kind = 'character',
    sourceScenes: sourceScenes = [],
    chapterIds: chapterIds = [],
    visualStyle: visualStyle = '',
  } = {},
) {
  const _0xdcd514 = normalizeStoryAssetKind(kind),
    _0x2fe542 = new Set(sourceScenes['map']((_0x876d89) => _0x876d89['ref'])),
    _0x412d03 = new Set(sourceScenes['map']((_0xd5be6) => _0xd5be6['episodeRef'])),
    _0x5b9da9 = getStoryAssetKindRawAssets(_0x383a7b, _0xdcd514),
    _0xccd242 = _0x5b9da9['map']((_0x12e270, _0x23c712) => {
      if (!_0x12e270 || typeof _0x12e270 !== 'object' || Array['isArray'](_0x12e270)) return null;
      const _0x228fd0 = normalizeText(_0x12e270['name']);
      if (!_0x228fd0) return null;
      let _0x4ee999 = normalizeStringArray(_0x12e270['sourceSceneRefs'] || _0x12e270['sceneRefs'])['filter'](
        (_0x1ab431) => _0x2fe542['has'](_0x1ab431),
      );
      !_0x4ee999['length'] &&
        (_0x4ee999 = inferStoryAssetSourceSceneRefs(_0xdcd514, _0x228fd0, sourceScenes));
      const _0x35fd6e = normalizeStringArray([
          ...deriveSourceEpisodeRefs(
            _0x4ee999,
            new Map(sourceScenes['map']((_0x5b1221) => [_0x5b1221['ref'], _0x5b1221])),
          ),
          ...normalizeStringArray(_0x12e270['sourceEpisodeRefs'] || _0x12e270['sourceChapterIds'])['filter'](
            (_0xe84f11) => _0x412d03['has'](_0xe84f11),
          ),
        ]),
        _0x395817 = resolveStoryAssetSourceChapterIds({
          sourceSceneRefs: _0x4ee999,
          sourceEpisodeRefs: _0x35fd6e,
          sourceScenes: sourceScenes,
          chapterIds: chapterIds,
        }),
        _0x32061d = normalizeReference(_0x12e270['ref'], _0xdcd514 + '-' + (_0x23c712 + 0x1)),
        _0x1d42a1 = normalizeText(_0x12e270['prompt'] || _0x12e270['description'] || _0x228fd0 + '视觉设定'),
        _0x3e9894 =
          _0xdcd514 === 'character' &&
          Array['isArray'](_0x12e270['appearances']) &&
          _0x12e270['appearances']['length']
            ? _0x12e270['appearances']
            : [
                {
                  name: '基础形象',
                  description: _0x12e270['description'],
                  occurrences: _0x12e270['occurrences'],
                  sourceSceneRefs: _0x4ee999,
                  prompt: _0x12e270['prompt'] || _0x12e270['appearances']?.[0x0]?.['prompt'],
                },
              ],
        _0x327cd4 = _0x3e9894['map']((_0x523d29, _0x5ef4b0) => {
          const _0x54827c = normalizeStringArray(_0x523d29?.['sourceSceneRefs'] || _0x523d29?.['sceneRefs'])[
              'filter'
            ]((_0x231d5c) => _0x2fe542['has'](_0x231d5c)),
            _0x1fdaeb = _0x54827c['length'] ? _0x54827c : _0x4ee999,
            _0x2ba0ce = deriveSourceEpisodeRefs(
              _0x1fdaeb,
              new Map(sourceScenes['map']((_0xda62a3) => [_0xda62a3['ref'], _0xda62a3])),
            ),
            _0x216ba0 = resolveStoryAssetSourceChapterIds({
              sourceSceneRefs: _0x1fdaeb,
              sourceEpisodeRefs: _0x2ba0ce,
              sourceScenes: sourceScenes,
              chapterIds: chapterIds,
            });
          return {
            ref: normalizeReference(_0x523d29?.['ref'], _0x32061d + '-appearance-' + (_0x5ef4b0 + 0x1)),
            name:
              normalizeText(_0x523d29?.['name']) ||
              (_0x5ef4b0 === 0x0 ? '基础形象' : '形象 ' + (_0x5ef4b0 + 0x1)),
            description: normalizeText(_0x523d29?.['description'] || _0x12e270['description']),
            occurrences:
              normalizeText(_0x523d29?.['occurrences'] || _0x12e270['occurrences']) ||
              buildOccurrences(_0x2ba0ce),
            sourceChapterIds: _0x216ba0,
            sourceEpisodeRefs: _0x2ba0ce,
            sourceSceneRefs: _0x1fdaeb,
            prompt: ensureStoryAssetVisualStyle(_0x523d29?.['prompt'] || _0x1d42a1, visualStyle),
          };
        });
      return {
        ref: _0x32061d,
        kind: _0xdcd514,
        name: _0x228fd0,
        role:
          _0xdcd514 === 'character'
            ? resolveStoryCharacterRole(_0x12e270['role'])
            : normalizeText(_0x12e270['role']) || (_0xdcd514 === 'scene' ? '剧情场景' : '关键道具'),
        description: normalizeText(_0x12e270['description']),
        voiceDescription: _0xdcd514 === 'character' ? normalizeText(_0x12e270['voiceDescription']) : '',
        occurrences: normalizeText(_0x12e270['occurrences']) || buildOccurrences(_0x35fd6e),
        sourceChapterIds: _0x395817,
        sourceEpisodeRefs: _0x35fd6e,
        sourceSceneRefs: _0x4ee999,
        appearances: _0x327cd4,
      };
    })['filter'](Boolean),
    _0x563038 = mergeStoryAssetKindResultAssets(_0xccd242),
    _0x14316a =
      _0xdcd514 === 'scene'
        ? normalizeStorySceneAssetsForCoverage(_0x563038, {
            sourceScenes: sourceScenes,
            chapterIds: chapterIds,
            visualStyle: visualStyle,
          })
        : _0x563038,
    _0x441bf4 = new Set(),
    _0x5ab176 = new Set();
  return (
    _0x14316a['forEach']((_0x5d1c11, _0x424e23) => {
      ((_0x5d1c11['ref'] = createUniqueStoryAssetInventoryRef(
        _0x5d1c11['ref'],
        _0x441bf4,
        _0xdcd514 + '-' + (_0x424e23 + 0x1),
      )),
        (_0x5d1c11['appearances'] = _0x5d1c11['appearances']['map']((_0xc262a1, _0xda782c) => ({
          ..._0xc262a1,
          ref: createUniqueStoryAssetAppearanceRef(
            _0xc262a1['ref'],
            _0x5ab176,
            _0x5d1c11['ref'] + '-appearance-' + (_0xda782c + 0x1),
          ),
        }))));
    }),
    { schemaVersion: STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION, kind: _0xdcd514, assets: _0x14316a }
  );
}
function cloneStoryAssetExtractionValue(_0x16aa06) {
  if (!_0x16aa06 || typeof _0x16aa06 !== 'object') return null;
  try {
    return JSON['parse'](JSON['stringify'](_0x16aa06));
  } catch {
    return null;
  }
}
function hashStoryAssetExtractionValue(_0x3adcf7) {
  const _0x2454bd = JSON['stringify'](_0x3adcf7);
  let _0x4ec515 = 0x811c9dc5;
  for (let _0x31c882 = 0x0; _0x31c882 < _0x2454bd['length']; _0x31c882 += 0x1) {
    ((_0x4ec515 ^= _0x2454bd['charCodeAt'](_0x31c882)), (_0x4ec515 = Math['imul'](_0x4ec515, 0x1000193)));
  }
  return (
    STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION +
    '-' +
    (_0x4ec515 >>> 0x0)['toString'](0x10)['padStart'](0x8, '0') +
    '-' +
    _0x2454bd['length']
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
    title: storyContext['title'],
    scriptMode: storyContext['scriptMode'],
    continuityFacts: storyContext['continuityFacts'],
    characters: storyContext['characters'],
    sourceScenes: sourceScenes,
    model: normalizeText(model),
    provider: normalizeText(provider),
    providerProfileId: normalizeText(providerProfileId),
    aspectRatio: normalizeText(aspectRatio) || storyContext['aspectRatio'],
    visualStyle: normalizeText(visualStyle) || storyContext['visualStyle'],
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
    title: storyContext['title'],
    scriptMode: storyContext['scriptMode'],
    continuityFacts: storyContext['continuityFacts'],
    characters: storyContext['characters'],
    sourceScenes: sourceScenes,
    aspectRatio: normalizeText(aspectRatio) || storyContext['aspectRatio'],
    visualStyle: normalizeText(visualStyle) || storyContext['visualStyle'],
    extractionStrategy: extractionStrategy,
    extractionKinds: STORY_ASSET_EXPERIMENTAL_KINDS,
  });
}
async function saveStoryAssetExtractionCheckpoint(_0x35ff60, _0x4f2184) {
  const _0x93e3eb = { ..._0x35ff60, updatedAt: Date['now']() };
  return (
    typeof _0x4f2184 === 'function' && (await _0x4f2184(cloneStoryAssetExtractionValue(_0x93e3eb))),
    _0x93e3eb
  );
}
function classifyStoryAssetKindError(_0x3d5a05) {
  const _0x190de5 = normalizeText(_0x3d5a05?.['message'] || _0x3d5a05),
    _0x15dd63 = normalizeText(_0x3d5a05?.['type'] || _0x3d5a05?.['code'])['toUpperCase']();
  if (
    _0x15dd63 === 'AUTH_ERROR' ||
    Number(_0x3d5a05?.['status']) === 0x191 ||
    /API\s*Key.*(?:无效|过期|未配置|错误)|认证失败|unauthori[sz]ed|invalid\s+api\s+key/iu['test'](_0x190de5)
  )
    return { type: 'auth', message: _0x190de5 };
  if (
    _0x15dd63 === 'RATE_LIMIT' ||
    Number(_0x3d5a05?.['status'] || _0x3d5a05?.['statusCode']) === 0x1ad ||
    /rate\s*limit|too\s*many\s*requests|限流|请求过于频繁/iu['test'](_0x190de5)
  )
    return { type: 'rate-limit', message: _0x190de5 };
  if (_0x15dd63 === 'TIMEOUT' || /超时|timeout|timed\s*out/iu['test'](_0x190de5))
    return { type: 'timeout', message: _0x190de5 };
  if (
    _0x15dd63 === 'DNS_ERROR' ||
    _0x15dd63 === 'ENOTFOUND' ||
    _0x15dd63 === 'EAI_AGAIN' ||
    /dns|name\s+resolution|getaddrinfo|域名解析/iu['test'](_0x190de5)
  )
    return { type: 'dns-error', message: _0x190de5 };
  if (
    _0x15dd63 === 'NETWORK_ERROR' ||
    /fetch\s+failed|failed\s+to\s+fetch|network\s+(?:error|failure)|网络(?:错误|异常|失败)/iu['test'](
      _0x190de5,
    )
  )
    return { type: 'network-error', message: _0x190de5 };
  if (
    ['ECONNRESET', 'ECONNABORTED', 'UND_ERR_SOCKET']['includes'](
      normalizeText(_0x3d5a05?.['code'])['toUpperCase'](),
    ) ||
    /connection\s*(?:reset|closed|aborted)|socket\s*hang\s*up|连接(?:被)?重置|连接中断/iu['test'](_0x190de5)
  )
    return { type: 'connection-reset', message: _0x190de5 };
  if (
    _0x15dd63 === 'OUTPUT_LENGTH' ||
    /max(?:imum)?\s*(?:output\s*)?tokens|finish[_\s-]*reason.{0,12}length|输出.{0,8}(?:截断|过长)|内容过长/iu[
      'test'
    ](_0x190de5)
  )
    return { type: 'length', message: _0x190de5 };
  if (_0x15dd63 === 'CALL_LIMIT') return { type: 'call-limit', message: _0x190de5 };
  if (
    _0x15dd63 === 'VALIDATION' ||
    _0x3d5a05?.['validationDetails'] ||
    /Agent 返回的.+(?:声音设定|图片提示词).*(?:缺少|不能为空)|形象数量与轻量清单不一致/iu['test'](_0x190de5)
  )
    return { type: 'validation', message: _0x190de5 };
  if (/资产细化结果必须与当前批次资产数量完全一致|缺少\s*\d+\s*个资产结果/u['test'](_0x190de5))
    return { type: 'incomplete-output', message: _0x190de5 };
  if (/有效的\s*JSON|JSON|缺少\s*assets\s*数组|返回格式/iu['test'](_0x190de5))
    return { type: 'invalid-json', message: _0x190de5 };
  return { type: 'request', message: _0x190de5 };
}
function isStoryAssetConfirmedUnchargedRejection(_0x41c604) {
  const _0xa7d645 = Number(_0x41c604?.['status'] ?? _0x41c604?.['statusCode']);
  return [0x190, 0x191, 0x193, 0x194, 0x199, 0x1a6, 0x1ad]['includes'](_0xa7d645);
}
function getStoryAssetKindErrorLabel(_0x698dbd = '', _0x1dae91 = '') {
  if (
    _0x698dbd === 'auth' ||
    classifyStoryAssetKindError({ type: _0x698dbd, message: _0x1dae91 })['type'] === 'auth'
  )
    return 'API\x20Key\x20无效或已过期';
  if (_0x698dbd === 'timeout') return '请求超时';
  if (_0x698dbd === 'rate-limit') return '请求限流';
  if (_0x698dbd === 'length') return '输出被截断';
  if (_0x698dbd === 'call-limit') return '达到自动调用上限';
  if (_0x698dbd === 'validation') return '结果校验失败';
  if (_0x698dbd === 'incomplete-output') return '输出缺少部分资产';
  if (_0x698dbd === 'invalid-json') return '返回格式不合格';
  return '请求失败';
}
function getStoryAssetResponseFinishReason(_0x38a326) {
  return normalizeText(
    _0x38a326?.['finishReason'] ||
      _0x38a326?.['finish_reason'] ||
      _0x38a326?.['choices']?.[0x0]?.['finish_reason'] ||
      _0x38a326?.['data']?.['choices']?.[0x0]?.['finish_reason'],
  );
}
function isStoryAssetResponseTruncated(_0x787fec) {
  const _0x1322ec =
    typeof _0x787fec === 'string'
      ? normalizeText(_0x787fec)['toLowerCase']()
      : getStoryAssetResponseFinishReason(_0x787fec)['toLowerCase']();
  return ['length', 'max_tokens', 'max_output_tokens']['includes'](_0x1322ec);
}
function createStoryAssetPipelineError(_0x1d1e00 = []) {
  const _0x34db03 = _0x1d1e00['slice'](0x0, 0x5)
      ['map']((_0x5b9dda) => {
        const _0x3efe3d =
            _0x5b9dda['stage'] === 'kind'
              ? STORY_ASSET_KIND_LABELS[_0x5b9dda['kind']] || '资产'
              : _0x5b9dda['stage'] === 'repair'
                ? '归并校验'
                : _0x5b9dda['stage'] === 'detail'
                  ? '提示词细化'
                  : '清单',
          _0x18411e = normalizeText(_0x5b9dda['batchLabel'] || _0x5b9dda['batchId']);
        return (
          '' +
          _0x3efe3d +
          (_0x18411e ? '\x20' + _0x18411e : '') +
          '（' +
          getStoryAssetKindErrorLabel(_0x5b9dda['errorType'], _0x5b9dda['errorMessage']) +
          '）'
        );
      })
      ['join']('、'),
    _0x283e76 = new Error(
      '资产提取未完成：' + (_0x34db03 || '存在未完成工作项') + '。已完成结果已保存，再次点击只处理未完成项。',
    );
  return ((_0x283e76['assetExtractionFailures'] = _0x1d1e00), _0x283e76);
}
function createStoryAssetPipelineContinuation(_0x44df1, _0x42377a, _0x5a8bb1 = {}) {
  const _0x13bc7e = new Error(_0x42377a);
  return (
    (_0x13bc7e['type'] = 'ASSET_EXTRACTION_CONTINUE_REQUIRED'),
    (_0x13bc7e['isContinuation'] = !![]),
    (_0x13bc7e['remaining'] = cloneStoryAssetExtractionValue(_0x5a8bb1)),
    (_0x13bc7e['assetExtractionDraft'] = cloneStoryAssetExtractionValue(_0x44df1)),
    _0x13bc7e
  );
}
function createStoryAssetBatchContractKey(_0xae815, _0x4a51db = []) {
  const _0x19d984 = JSON['stringify']({
    stage: normalizeText(_0xae815),
    identities: normalizeStringArray(_0x4a51db),
  });
  let _0x3122de = 0x811c9dc5;
  for (let _0x59b83c = 0x0; _0x59b83c < _0x19d984['length']; _0x59b83c += 0x1) {
    ((_0x3122de ^= _0x19d984['charCodeAt'](_0x59b83c)), (_0x3122de = Math['imul'](_0x3122de, 0x1000193)));
  }
  return (
    (normalizeText(_0xae815) || 'batch') + '-' + (_0x3122de >>> 0x0)['toString'](0x10)['padStart'](0x8, '0')
  );
}
function createStoryAssetPipelineKindStates(
  _0x3ce71d = [],
  _0x4191df = [],
  _0x18733b = [],
  { inventoryRunning: inventoryRunning = ![] } = {},
) {
  const _0x28f8d3 = new Set(_0x4191df['map']((_0x12d84b) => _0x12d84b['ref']));
  return Object['fromEntries'](
    STORY_ASSET_EXPERIMENTAL_KINDS['map']((_0xfe939c) => {
      const _0x185276 = _0x3ce71d['filter']((_0x28a1e2) => _0x28a1e2['kind'] === _0xfe939c),
        _0x5220aa = _0x185276['filter']((_0x29e975) => _0x28f8d3['has'](_0x29e975['ref']))['length'],
        _0xecce26 = _0x18733b['filter']((_0x43263b) => !_0x43263b['kind'] || _0x43263b['kind'] === _0xfe939c);
      let _0x383310 = 'pending';
      if (inventoryRunning) _0x383310 = 'running';
      else {
        if (_0x185276['length'] && _0x5220aa === _0x185276['length']) _0x383310 = 'succeeded';
        else {
          if (_0xecce26['length']) _0x383310 = 'failed';
          else {
            if (_0x5220aa || _0x185276['length']) _0x383310 = 'running';
          }
        }
      }
      const _0x30ad44 = _0xecce26[0x0];
      return [
        _0xfe939c,
        {
          kind: _0xfe939c,
          status: _0x383310,
          attempt: 0x0,
          assetCount: _0x5220aa,
          totalAssetCount: _0x185276['length'],
          errorType: _0x30ad44?.['errorType'] || '',
          errorMessage: _0x30ad44?.['errorMessage'] || '',
          startedAt: 0x0,
          finishedAt: _0x383310 === 'succeeded' || _0x383310 === 'failed' ? Date['now']() : 0x0,
        },
      ];
    }),
  );
}
function restoreStoryAssetPipelineDraft(
  _0x12cc7d,
  {
    sourceFingerprint: sourceFingerprint = '',
    sourceContentFingerprint: sourceContentFingerprint = '',
    extractionStrategy: extractionStrategy = STORY_ASSET_EXTRACTION_DRAFT_STRATEGY,
  } = {},
) {
  const _0x3613f9 = cloneStoryAssetExtractionValue(_0x12cc7d);
  if (
    !_0x3613f9 ||
    _0x3613f9['strategy'] !== extractionStrategy ||
    _0x3613f9['schemaVersion'] !== STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION
  )
    return null;
  const _0x31e773 = normalizeText(_0x3613f9['sourceFingerprint']) === sourceFingerprint,
    _0x2ef344 = Boolean(
      normalizeText(_0x3613f9['sourceContentFingerprint']) &&
      normalizeText(_0x3613f9['sourceContentFingerprint']) === sourceContentFingerprint,
    );
  return _0x31e773 || _0x2ef344 ? _0x3613f9 : null;
}
function splitStoryAssetWorkItems(_0x92ccac = []) {
  const _0x70df71 = Math['max'](0x1, Math['ceil'](_0x92ccac['length'] / 0x2));
  return [_0x92ccac['slice'](0x0, _0x70df71), _0x92ccac['slice'](_0x70df71)]['filter'](
    (_0x51c8bf) => _0x51c8bf['length'],
  );
}
function updateStoryAssetOutputEstimates(_0x601ff = {}, _0x29a1d5 = []) {
  const _0x3b20b3 = { ..._0x601ff };
  return (
    STORY_ASSET_EXPERIMENTAL_KINDS['forEach']((_0x4fe0e2) => {
      const _0x44aee5 = _0x29a1d5['filter']((_0x14678b) => _0x14678b['kind'] === _0x4fe0e2);
      if (!_0x44aee5['length']) return;
      const _0x5ce23b = Math['ceil'](
          _0x44aee5['reduce'](
            (_0x19980b, _0xfbb9c) => _0x19980b + JSON['stringify'](_0xfbb9c)['length'],
            0x0,
          ) / _0x44aee5['length'],
        ),
        _0x23f310 = Math['max'](
          0x258,
          Number(_0x3b20b3[_0x4fe0e2]) || (_0x4fe0e2 === 'character' ? 0x898 : 0x4b0),
        );
      _0x3b20b3[_0x4fe0e2] = Math['max'](0x258, Math['ceil'](_0x23f310 * 0.65 + _0x5ce23b * 0.35));
    }),
    _0x3b20b3
  );
}
function reportStoryAssetDiagnostics(_0x337633, _0x188ee8, _0x1a9e45 = {}) {
  try {
    const _0x429e28 =
      typeof _0x337633?.['info'] === 'function'
        ? _0x337633['info'](_0x188ee8, _0x1a9e45)
        : _0x337633?.['logEvent']?.({
            type:
              'story_asset.' +
              normalizeText(_0x188ee8)
                ['replace'](/^story-asset-?/iu, '')
                ['replace'](/[^a-z0-9]+/giu, '_'),
            level: _0x1a9e45?.['status'] === 'failed' ? 'error' : 'info',
            source: 'renderer',
            message: normalizeText(_0x188ee8) || 'Story asset extraction event',
            context: _0x1a9e45,
          });
    _0x429e28 &&
      typeof _0x429e28['then'] === 'function' &&
      void Promise['resolve'](_0x429e28)['catch'](() => undefined);
  } catch {}
}
function buildStoryAssetBaselinePrompt(_0x1413a5 = {}, _0xcbcfab = {}, _0x15e28a = '') {
  const _0xa9a038 = normalizeText(_0x1413a5['kind']),
    _0x4f2830 = normalizeStringArray(
      [
        _0x1413a5['name'],
        _0x1413a5['scriptFacts'] || _0x1413a5['description'],
        _0x1413a5['visualDesign'],
        _0xcbcfab['name'] && _0xcbcfab['name'] !== '基础形象' ? _0xcbcfab['name'] : '',
        _0xcbcfab['scriptFacts'] || _0xcbcfab['description'],
        _0xcbcfab['visualDesign'],
      ]['map'](sanitizeStoryAssetPublicPromptText),
    )['join']('，'),
    _0xbf0282 =
      _0xa9a038 === 'character'
        ? '正面全身独立人物设定图，中性站姿，无剧情动作、无手持或背负道具，完整展示服装、发型、五官与体态'
        : _0xa9a038 === 'scene'
          ? '环境概念设定图，默认无人，完整展示空间布局、时间状态、光线与关键环境结构'
          : '单体道具设定图，默认无人手持，完整展示轮廓、材质、结构与剧情要求的状态';
  return ensureStoryAssetVisualStyle([_0x4f2830, _0xbf0282]['filter'](Boolean)['join']('，'), _0x15e28a);
}
function createStoryAssetBaselineVisualDesign(_0x3f5475 = {}) {
  const _0x2f2f6a = normalizeText(_0x3f5475?.['name']) || '该资产',
    _0x5712cc = normalizeText(_0x3f5475?.['kind']);
  if (_0x5712cc === 'character')
    return (
      _0x2f2f6a +
      '的外观符合' +
      (normalizeText(_0x3f5475?.['role']) || '剧情角色') +
      '身份与项目时代背景，形成稳定、可复用的人物设定'
    );
  if (_0x5712cc === 'scene')
    return _0x2f2f6a + '的空间布局、结构材质、时间光线与剧本场景标题及项目世界观保持一致';
  return _0x2f2f6a + '的轮廓、材质、尺寸与关键结构符合剧本用途，形成清晰可辨的单体道具设定';
}
function sanitizeStoryAssetPublicAsset(_0x488bb6 = {}, { visualStyle: visualStyle = '' } = {}) {
  const _0x3d290a = normalizeText(_0x488bb6?.['designStatus']) === 'baseline',
    _0xb600b8 = stripStoryAssetInternalEvidenceMetadata(
      _0x488bb6?.['scriptFacts'] || _0x488bb6?.['description'],
    ),
    _0x2b0399 =
      stripStoryAssetInternalEvidenceMetadata(_0x488bb6?.['visualDesign']) ||
      (_0x3d290a ? createStoryAssetBaselineVisualDesign(_0x488bb6) : ''),
    _0x534cbe = formatStoryAssetFactAndDesignDescription({
      scriptFacts: _0xb600b8,
      visualDesign: _0x2b0399,
      description: _0x488bb6?.['description'],
    }),
    _0x49680e = (Array['isArray'](_0x488bb6?.['appearances']) ? _0x488bb6['appearances'] : [])['map'](
      (_0x4d9a86) => {
        const _0x1d502e = _0x3d290a || normalizeText(_0x4d9a86?.['designStatus']) === 'baseline',
          _0x4fbf0a = stripStoryAssetInternalEvidenceMetadata(
            _0x4d9a86?.['scriptFacts'] || _0x4d9a86?.['description'] || _0xb600b8,
          ),
          _0x209153 =
            stripStoryAssetInternalEvidenceMetadata(_0x4d9a86?.['visualDesign']) ||
            (_0x1d502e ? _0x2b0399 : ''),
          _0x46d91f = formatStoryAssetFactAndDesignDescription({
            scriptFacts: _0x4fbf0a,
            visualDesign: _0x209153,
            description: _0x4d9a86?.['description'],
          }),
          _0x55e1fe = {
            ..._0x4d9a86,
            description: _0x46d91f,
            scriptFacts: _0x4fbf0a,
            visualDesign: _0x209153,
          };
        return {
          ..._0x55e1fe,
          prompt: _0x1d502e
            ? buildStoryAssetBaselinePrompt(
                { ..._0x488bb6, description: _0x534cbe, scriptFacts: _0xb600b8, visualDesign: _0x2b0399 },
                _0x55e1fe,
                visualStyle,
              )
            : ensureStoryAssetVisualStyle(_0x4d9a86?.['prompt'], visualStyle),
        };
      },
    );
  return {
    ..._0x488bb6,
    description: _0x534cbe,
    scriptFacts: _0xb600b8,
    visualDesign: _0x2b0399,
    appearances: _0x49680e,
    prompt: _0x49680e[0x0]?.['prompt'] || ensureStoryAssetVisualStyle(_0x488bb6?.['prompt'], visualStyle),
  };
}
export function finalizeStoryAssetInventoryAssets({
  inventory: inventory = {},
  sourceScenes: sourceScenes = [],
  chapterIds: chapterIds = [],
  visualStyle: visualStyle = '',
} = {}) {
  return (Array['isArray'](inventory?.['assets']) ? inventory['assets'] : [])['map']((_0x1fb5e4) => {
    const _0x3e476a = resolveStoryAssetSourceChapterIds({
        sourceSceneRefs: _0x1fb5e4['sourceSceneRefs'],
        sourceEpisodeRefs: _0x1fb5e4['sourceEpisodeRefs'],
        sourceScenes: sourceScenes,
        chapterIds: chapterIds,
      }),
      _0x468e5b = (Array['isArray'](_0x1fb5e4['appearances']) ? _0x1fb5e4['appearances'] : [])['map'](
        (_0x4de4fa) => {
          const _0x4bed34 = resolveStoryAssetSourceChapterIds({
            sourceSceneRefs: _0x4de4fa['sourceSceneRefs'],
            sourceEpisodeRefs: _0x4de4fa['sourceEpisodeRefs'],
            sourceScenes: sourceScenes,
            chapterIds: chapterIds,
          });
          return {
            ..._0x4de4fa,
            sourceChapterIds: _0x4bed34,
            prompt: buildStoryAssetBaselinePrompt(_0x1fb5e4, _0x4de4fa, visualStyle),
            designStatus: 'baseline',
          };
        },
      );
    return {
      ..._0x1fb5e4,
      role:
        _0x1fb5e4['kind'] === 'character'
          ? normalizeStoryAssetFinalCharacterRole(_0x1fb5e4['role'])
          : _0x1fb5e4['role'],
      voiceDescription: '',
      sourceChapterIds: _0x3e476a,
      prompt: _0x468e5b[0x0]?.['prompt'] || '',
      appearances: _0x468e5b,
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
  })['map']((_0x356cf6) => ({
    ref: _0x356cf6['ref'],
    kind: _0x356cf6['kind'],
    name: _0x356cf6['name'],
    role: _0x356cf6['role'],
    description: _0x356cf6['description'],
    occurrences: normalizeStringArray(_0x356cf6['sourceChapterIds'])['length']
      ? buildOccurrences(_0x356cf6['sourceChapterIds'])
      : normalizeText(_0x356cf6['occurrences']),
    sourceSceneRefs: normalizeStringArray(_0x356cf6['sourceSceneRefs']),
    sourceEpisodeRefs: normalizeStringArray(_0x356cf6['sourceChapterIds']),
    appearances: (Array['isArray'](_0x356cf6['appearances']) ? _0x356cf6['appearances'] : [])['map'](
      (_0xa9f8ad) => ({
        ref: _0xa9f8ad['ref'],
        name: _0xa9f8ad['name'],
        description: _0xa9f8ad['description'],
        occurrences: normalizeStringArray(_0xa9f8ad['sourceChapterIds'])['length']
          ? buildOccurrences(_0xa9f8ad['sourceChapterIds'])
          : normalizeText(_0xa9f8ad['occurrences']),
        sourceSceneRefs: normalizeStringArray(_0xa9f8ad['sourceSceneRefs']),
        sourceEpisodeRefs: normalizeStringArray(_0xa9f8ad['sourceChapterIds']),
      }),
    ),
  }));
}
function createStoryAssetBaselineDetailAssets(
  _0x116275 = [],
  { sourceScenes: sourceScenes = [], visualStyle: visualStyle = '' } = {},
) {
  const _0x688e23 = new Map(sourceScenes['map']((_0x252eb7) => [_0x252eb7['ref'], _0x252eb7]));
  return _0x116275['map']((_0x553a6a) => {
    const _0x27eeb9 = normalizeStringArray(
        _0x553a6a['sourceSceneRefs']
          ['map']((_0x1dc3d2) => _0x688e23['get'](_0x1dc3d2))
          ['filter'](Boolean)
          ['slice'](0x0, 0x2)
          ['map']((_0x1d6d71) =>
            [
              normalizeText(_0x1d6d71['heading']),
              stripStoryAssetInternalEvidenceMetadata(_0x1d6d71['body'])['slice'](0x0, 0xa0),
            ]
              ['filter'](Boolean)
              ['join']('：'),
          ),
      )['join']('；'),
      _0x26a7fc =
        stripStoryAssetInternalEvidenceMetadata(_0x553a6a['description']) ||
        _0x27eeb9 ||
        _0x553a6a['name'] + '在剧本相关场次中出现。',
      _0x1845eb = createStoryAssetBaselineVisualDesign(_0x553a6a),
      _0x41ee93 = formatStoryAssetFactAndDesignDescription({
        scriptFacts: _0x26a7fc,
        visualDesign: _0x1845eb,
      }),
      _0x17902e = _0x553a6a['appearances']['map']((_0x4631ba) => ({
        ref: _0x4631ba['ref'],
        name: _0x4631ba['name'],
        description: normalizeText(_0x4631ba['description']) || _0x41ee93,
        occurrences: buildOccurrences(_0x4631ba['sourceEpisodeRefs']),
        prompt: buildStoryAssetBaselinePrompt(
          { ..._0x553a6a, description: _0x41ee93, scriptFacts: _0x26a7fc, visualDesign: _0x1845eb },
          {
            ..._0x4631ba,
            scriptFacts: stripStoryAssetInternalEvidenceMetadata(_0x4631ba['description']) || _0x26a7fc,
            visualDesign: _0x1845eb,
          },
          visualStyle,
        ),
        sourceChapterIds: _0x4631ba['sourceEpisodeRefs'],
        sourceEpisodeRefs: _0x4631ba['sourceEpisodeRefs'],
        sourceSceneRefs: _0x4631ba['sourceSceneRefs'],
        scriptFacts: _0x26a7fc,
        visualDesign: _0x1845eb,
        designStatus: 'baseline',
      }));
    return {
      ref: _0x553a6a['ref'],
      kind: _0x553a6a['kind'],
      name: _0x553a6a['name'],
      role: _0x553a6a['role'],
      description: _0x41ee93,
      voiceDescription:
        _0x553a6a['kind'] === 'character'
          ? [
              '年龄：未明确',
              '性别：未明确',
              '身份：' + (_0x553a6a['role'] || '剧情角色'),
              '口音：标准普通话',
              '情绪底色：中性克制',
              '声线：自然清晰',
              '语速：中等',
              '说话方式：符合角色身份',
              '音色特征：自然稳定',
            ]['join']('；')
          : '',
      occurrences: buildOccurrences(_0x553a6a['sourceEpisodeRefs']),
      prompt: _0x17902e[0x0]?.['prompt'] || '',
      sourceChapterIds: _0x553a6a['sourceEpisodeRefs'],
      sourceEpisodeRefs: _0x553a6a['sourceEpisodeRefs'],
      sourceSceneRefs: _0x553a6a['sourceSceneRefs'],
      appearances: _0x17902e,
      scriptFacts: _0x26a7fc,
      visualDesign: _0x1845eb,
      designStatus: 'baseline',
    };
  });
}
export async function extractStoryAssetsEvidenceBatched({
  project: project = {},
  episodes: episodes = [],
  sourceScenes: _0x470379 = null,
  authoritativeSourceScenes: _0x230c67 = null,
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
  allowLocalBaselineFallback: allowLocalBaselineFallback = !![],
  paidRerunAuthorization: paidRerunAuthorization = null,
} = {}) {
  request = withReplicationRequestPolicy(request, project);
  const _0xc16409 = normalizeText(model),
    _0x48bb0e = normalizeText(provider),
    _0x545d08 = normalizeText(providerProfileId);
  if (!_0xc16409 || !_0x48bb0e) throw new Error('请先选择可用的文本模型。');
  const _0x42827c = normalizeStoryContext(project),
    _0x3f938b =
      Array['isArray'](_0x470379) && _0x470379['length']
        ? cloneStoryAssetExtractionValue(_0x470379)
        : normalizeStoryAssetExtractionSources(episodes),
    _0x4c98ca = new Map(
      (Array['isArray'](_0x230c67) ? _0x230c67 : [])['map']((_0x1937ee) => [_0x1937ee?.['ref'], _0x1937ee]),
    ),
    _0x92e8b = _0x3f938b['map']((_0x925d60) => {
      const _0x5a298d = _0x4c98ca['get'](_0x925d60?.['ref']);
      if (!_0x5a298d) return _0x925d60;
      return { ..._0x925d60, characters: cloneStoryAssetExtractionValue(_0x5a298d['characters'] || []) };
    }),
    _0x46d60e = normalizeText(visualStyle) || _0x42827c['visualStyle'],
    _0xde30a0 = createStoryAssetExtractionFingerprint({
      storyContext: _0x42827c,
      sourceScenes: _0x3f938b,
      model: _0xc16409,
      provider: _0x48bb0e,
      providerProfileId: _0x545d08,
      aspectRatio: aspectRatio,
      visualStyle: _0x46d60e,
      extractionStrategy: STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY,
    }),
    _0x29163d = createStoryAssetExtractionContentFingerprint({
      storyContext: _0x42827c,
      sourceScenes: _0x3f938b,
      aspectRatio: aspectRatio,
      visualStyle: _0x46d60e,
      extractionStrategy: STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY,
    }),
    _0x24e47c = cloneStoryAssetExtractionValue(resumeDraft),
    _0x29aa45 = restoreStoryAssetPipelineDraft(resumeDraft, {
      sourceFingerprint: _0xde30a0,
      sourceContentFingerprint: _0x29163d,
      extractionStrategy: STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY,
    }),
    _0x56f941 =
      _0x24e47c?.['batchSubmissionRecords'] && typeof _0x24e47c['batchSubmissionRecords'] === 'object'
        ? _0x24e47c['batchSubmissionRecords']
        : {},
    _0x2ad37a =
      !_0x29aa45 && _0x24e47c?.['strategy'] === STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY
        ? Object['entries'](_0x56f941)['flatMap'](([_0x40e7f9, _0x1e7b8e]) => {
            const _0x48ef15 = normalizeText(_0x1e7b8e?.['status']),
              _0x3389c6 =
                _0x48ef15 !== 'rejected-confirmed' &&
                (Math['max'](0x0, Math['trunc'](Number(_0x1e7b8e?.['requestCount']) || 0x0)) > 0x0 ||
                  Object['hasOwn'](_0x1e7b8e || {}, 'rawResponse') ||
                  [
                    'submitted',
                    'ambiguous',
                    'blocked-ambiguous-submission',
                    'response-received',
                    'blocked-paid-response',
                    'blocked-incompatible',
                    'validated',
                  ]['includes'](_0x48ef15));
            return _0x3389c6 ? [_0x40e7f9] : [];
          })
        : [],
    _0x5065d2 = _0x2ad37a['length'] > 0x0,
    _0x1f9cae = Math['min'](
      STORY_ASSET_BATCH_REQUEST_LIMIT,
      Math['max'](0x1, Math['trunc'](Number(requestLimit) || 0x0)),
    );
  let _0x429444 = 0x0,
    _0x4b4c56 = ![],
    _0x39222a = '';
  const _0x406830 = (_0x3205d9 = {}) => ({
    strategy: STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY,
    schemaVersion: STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION,
    sourceFingerprint: _0xde30a0,
    sourceContentFingerprint: _0x29163d,
    status: 'pending',
    phase: 'inventory',
    inventoryBatches: [],
    inventory: null,
    completedAssets: [],
    detailBatches: [],
    batchSubmissionRecords: {},
    paidBatchHistory: {},
    outputEstimates: { character: 0x898, scene: 0x4b0, prop: 0x4b0 },
    failures: [],
    totalRequestCount: 0x0,
    ...(_0x3205d9 && typeof _0x3205d9 === 'object' ? { paidBatchHistory: _0x3205d9 } : {}),
  });
  let _0x9ad6a8 = _0x29aa45 || (_0x5065d2 ? _0x24e47c : _0x406830());
  _0x9ad6a8['strategy'] = STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY;
  !_0x5065d2 &&
    ((_0x9ad6a8['schemaVersion'] = STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION),
    (_0x9ad6a8['sourceFingerprint'] = _0xde30a0),
    (_0x9ad6a8['sourceContentFingerprint'] = _0x29163d));
  ((_0x9ad6a8['failures'] = []),
    (_0x9ad6a8['runRequestCount'] = 0x0),
    (_0x9ad6a8['requestLimit'] = _0x1f9cae),
    (_0x9ad6a8['batchSubmissionRecords'] =
      _0x9ad6a8['batchSubmissionRecords'] && typeof _0x9ad6a8['batchSubmissionRecords'] === 'object'
        ? _0x9ad6a8['batchSubmissionRecords']
        : {}),
    (_0x9ad6a8['paidBatchHistory'] =
      _0x9ad6a8['paidBatchHistory'] && typeof _0x9ad6a8['paidBatchHistory'] === 'object'
        ? _0x9ad6a8['paidBatchHistory']
        : {}));
  const _0x153924 = async ({ message: message = '', stage: stage = _0x9ad6a8['phase'] } = {}) => {
      const _0x3c5fd9 = Array['isArray'](_0x9ad6a8['inventory']?.['assets'])
          ? _0x9ad6a8['inventory']['assets']
          : [],
        _0x1ab657 = Array['isArray'](_0x9ad6a8['completedAssets']) ? _0x9ad6a8['completedAssets'] : [],
        _0x1e0930 = stage === 'inventory' || stage === 'repair';
      ((_0x9ad6a8['kindStates'] = createStoryAssetPipelineKindStates(
        _0x3c5fd9,
        _0x1ab657,
        _0x9ad6a8['failures'],
        { inventoryRunning: stage === 'inventory' && _0x9ad6a8['status'] === 'in-progress' },
      )),
        (_0x9ad6a8['progress'] = {
          stage: stage,
          current: _0x1e0930
            ? new Set(
                (_0x9ad6a8['inventoryBatches'] || [])
                  ['filter']((_0x5ed66e) => _0x5ed66e['status'] === 'succeeded')
                  ['flatMap']((_0x33ed1e) => _0x33ed1e['sourceSceneRefs'] || []),
              )['size']
            : _0x1ab657['length'],
          total: _0x1e0930 ? _0x92e8b['length'] : _0x3c5fd9['length'],
          message: message,
          requestCount: _0x429444,
          callLimit: _0x1f9cae,
        }),
        (_0x9ad6a8 = await saveStoryAssetExtractionCheckpoint(_0x9ad6a8, onCheckpoint)),
        onProgress?.({
          stage:
            stage === 'repair'
              ? 'repairing-asset-inventory'
              : stage === 'detail'
                ? 'detailing-story-assets'
                : 'extracting-asset-inventory',
          current: _0x9ad6a8['progress']['current'],
          total: _0x9ad6a8['progress']['total'],
          message: message,
        }));
    },
    _0x5e2720 = (_0x682468) => {
      if (paidRerunAuthorization?.['confirmed'] !== !![]) return ![];
      const _0x19a3c0 = Array['isArray'](paidRerunAuthorization?.['authorizedBatchIds'])
        ? paidRerunAuthorization['authorizedBatchIds']
        : [];
      return _0x19a3c0['includes'](_0x682468);
    },
    _0x38b049 = (_0x9ed7b7, _0xbd75bb) => {
      const _0x137794 = _0x9ad6a8['batchSubmissionRecords'][_0x9ed7b7];
      if (!_0x137794) return;
      const _0x49c4c8 = Array['isArray'](_0x9ad6a8['paidBatchHistory'][_0x9ed7b7])
        ? _0x9ad6a8['paidBatchHistory'][_0x9ed7b7]
        : [];
      (_0x49c4c8['push']({
        ...cloneStoryAssetExtractionValue(_0x137794),
        archivedAt: Date['now'](),
        archiveReason: _0xbd75bb,
      }),
        (_0x9ad6a8['paidBatchHistory'][_0x9ed7b7] = _0x49c4c8),
        delete _0x9ad6a8['batchSubmissionRecords'][_0x9ed7b7]);
    },
    _0x2ecc29 = (_0x5bca3d, _0x5966c1, _0x42951e, _0x16f44e) => {
      const _0x1b37e4 = new Error(_0x16f44e);
      return (
        (_0x1b37e4['type'] = _0x5bca3d),
        (_0x1b37e4['batchKey'] = _0x5966c1),
        (_0x1b37e4['batchId'] = _0x42951e?.['batchId'] || ''),
        (_0x1b37e4['assetExtractionDraft'] = cloneStoryAssetExtractionValue(_0x9ad6a8)),
        _0x1b37e4
      );
    };
  if (_0x5065d2) {
    const _0x346b82 = _0x2ad37a['every']((_0x57e535) => _0x5e2720(_0x57e535));
    if (!_0x346b82) {
      (_0x2ad37a['forEach']((_0x902b2) => {
        const _0xe7ecf3 = _0x9ad6a8['batchSubmissionRecords'][_0x902b2];
        if (!_0xe7ecf3) return;
        (_0xe7ecf3['status'] !== 'blocked-incompatible' &&
          (_0xe7ecf3['incompatiblePreviousStatus'] = _0xe7ecf3['status']),
          (_0xe7ecf3['status'] = 'blocked-incompatible'),
          (_0xe7ecf3['errorType'] = 'contract-incompatible'),
          (_0xe7ecf3['errorMessage'] = '已付费批次的来源或草稿版本与当前请求不兼容。'),
          (_0xe7ecf3['blockedAt'] = Date['now']()));
      }),
        (_0x9ad6a8['status'] = 'blocked'),
        await _0x153924({
          stage: _0x9ad6a8['phase'],
          message: '已付费批次与当前剧本来源或草稿版本不兼容；未自动重新请求',
        }));
      const [_0x397484] = _0x2ad37a,
        _0x402c30 = _0x9ad6a8['batchSubmissionRecords'][_0x397484] || {},
        _0x240415 = _0x2ecc29(
          'ASSET_CONTRACT_INCOMPATIBLE',
          _0x397484,
          _0x402c30,
          '已付费批次与当前剧本来源或草稿版本不兼容；需要逐批明确授权后才能重新请求。',
        );
      _0x240415['blockedBatchIds'] = [..._0x2ad37a];
      throw _0x240415;
    }
    const _0x2d7d6e = Math['max'](0x0, Math['trunc'](Number(_0x9ad6a8['totalRequestCount']) || 0x0));
    _0x2ad37a['forEach']((_0x35a980) => {
      _0x38b049(_0x35a980, 'authorized-source-or-schema-change-rerun');
    });
    const _0x20892e = cloneStoryAssetExtractionValue(_0x9ad6a8['paidBatchHistory']) || {};
    ((_0x9ad6a8 = _0x406830(_0x20892e)),
      (_0x9ad6a8['totalRequestCount'] = _0x2d7d6e),
      (_0x9ad6a8['runRequestCount'] = 0x0),
      (_0x9ad6a8['requestLimit'] = _0x1f9cae),
      await _0x153924({ stage: 'inventory', message: '旧付费批次已归档，正在按当前剧本重新提取' }));
  }
  const _0x43c2d9 = async (_0x15fc89, _0x5671e2 = {}) => {
      const _0x181112 =
          normalizeText(_0x5671e2?.['batchKey']) ||
          createStoryAssetBatchContractKey(
            _0x5671e2?.['stage'],
            _0x5671e2?.['contractIdentities'] || [_0x5671e2?.['batchId']],
          ),
        _0x53e731 = _0x9ad6a8['batchSubmissionRecords'][_0x181112];
      if (_0x53e731 && ['submitted', 'ambiguous']['includes'](_0x53e731['status'])) {
        if (_0x5e2720(_0x181112)) _0x38b049(_0x181112, 'authorized-ambiguous-submission-rerun');
        else {
          ((_0x53e731['status'] = 'blocked-ambiguous-submission'),
            (_0x9ad6a8['status'] = 'blocked'),
            await _0x153924({
              stage: _0x5671e2?.['stage'],
              message: (_0x5671e2?.['batchId'] || _0x181112) + '提交状态不明确；未自动重新请求',
            }));
          throw _0x2ecc29(
            'ASSET_SUBMISSION_AMBIGUOUS',
            _0x181112,
            _0x5671e2,
            (_0x5671e2?.['batchId'] || _0x181112) +
              '请求已提交但无法确认是否计费；需要明确授权后才能重新请求。',
          );
        }
      } else {
        if (_0x53e731 && _0x53e731['status'] === 'blocked-ambiguous-submission') {
          if (_0x5e2720(_0x181112)) _0x38b049(_0x181112, 'authorized-ambiguous-submission-rerun');
          else {
            ((_0x9ad6a8['status'] = 'blocked'),
              await _0x153924({
                stage: _0x5671e2?.['stage'],
                message: (_0x5671e2?.['batchId'] || _0x181112) + '提交状态不明确；未自动重新请求',
              }));
            throw _0x2ecc29(
              'ASSET_SUBMISSION_AMBIGUOUS',
              _0x181112,
              _0x5671e2,
              (_0x5671e2?.['batchId'] || _0x181112) +
                '请求已提交但无法确认是否计费；需要明确授权后才能重新请求。',
            );
          }
        } else {
          if (
            _0x53e731 &&
            ['response-received', 'blocked-paid-response', 'blocked-incompatible', 'validated']['includes'](
              _0x53e731['status'],
            )
          ) {
            if (_0x5e2720(_0x181112))
              _0x38b049(
                _0x181112,
                _0x53e731['status'] === 'blocked-incompatible'
                  ? 'authorized-incompatible-paid-response-rerun'
                  : 'authorized-invalid-paid-response-rerun',
              );
            else {
              if (_0x53e731['status'] === 'blocked-incompatible') {
                _0x9ad6a8['status'] = 'blocked';
                throw _0x2ecc29(
                  'ASSET_CONTRACT_INCOMPATIBLE',
                  _0x181112,
                  _0x5671e2,
                  (_0x5671e2?.['batchId'] || _0x181112) + '的已付费结果与当前合同不兼容；未自动重新请求。',
                );
              } else {
                if (normalizeText(_0x53e731['rawResponse'])) return _0x53e731['rawResponse'];
                else {
                  _0x53e731['status'] = 'blocked-paid-response';
                  throw _0x2ecc29(
                    'ASSET_PAID_RESULT_BLOCKED',
                    _0x181112,
                    _0x5671e2,
                    (_0x5671e2?.['batchId'] || _0x181112) + '已付费但返回为空；未自动重新请求。',
                  );
                }
              }
            }
          }
        }
      }
      if (_0x429444 >= _0x1f9cae)
        throw Object['assign'](
          new Error('已达到本轮 ' + _0x1f9cae + ' 次分批请求上限。已完成结果已保存，系统将自动继续。'),
          { type: 'CALL_LIMIT' },
        );
      ((_0x429444 += 0x1),
        (_0x9ad6a8['runRequestCount'] = _0x429444),
        (_0x9ad6a8['totalRequestCount'] =
          Math['max'](0x0, Number(_0x9ad6a8['totalRequestCount']) || 0x0) + 0x1));
      const _0x4e5e65 = Date['now']();
      ((_0x9ad6a8['batchSubmissionRecords'][_0x181112] = {
        batchKey: _0x181112,
        batchId: normalizeText(_0x5671e2?.['batchId']),
        stage: normalizeText(_0x5671e2?.['stage']),
        kinds: normalizeStringArray(_0x5671e2?.['kinds']),
        status: 'submitted',
        requestCount:
          Math['max'](
            0x0,
            Math['trunc'](Number(_0x9ad6a8['batchSubmissionRecords'][_0x181112]?.['requestCount']) || 0x0),
          ) + 0x1,
        submittedAt: _0x4e5e65,
        contractSnapshot: cloneStoryAssetExtractionValue(_0x15fc89),
        rawResponse: '',
      }),
        await _0x153924({
          stage: _0x5671e2?.['stage'],
          message: (_0x5671e2?.['batchId'] || _0x181112) + '已提交，等待付费结果',
        }),
        reportStoryAssetDiagnostics(diagnostics, 'story-asset-request', {
          ..._0x5671e2,
          status: 'started',
          requestCount: _0x429444,
          callLimit: _0x1f9cae,
          promptCharacters: normalizeText(_0x15fc89['prompt'])['length'],
        }));
      let _0x28e7b7;
      try {
        _0x28e7b7 = await request(_0x15fc89);
      } catch (_0x588518) {
        const _0x4c650f = classifyStoryAssetKindError(_0x588518),
          _0x5b4cc6 = !isStoryAssetConfirmedUnchargedRejection(_0x588518);
        _0x9ad6a8['batchSubmissionRecords'][_0x181112] = {
          ..._0x9ad6a8['batchSubmissionRecords'][_0x181112],
          status: _0x5b4cc6 ? 'blocked-ambiguous-submission' : 'rejected-confirmed',
          failedAt: Date['now'](),
          errorType: _0x4c650f['type'],
          errorMessage: _0x4c650f['message'],
        };
        if (_0x5b4cc6) _0x9ad6a8['status'] = 'blocked';
        (await _0x153924({
          stage: _0x5671e2?.['stage'],
          message: _0x5b4cc6
            ? (_0x5671e2?.['batchId'] || _0x181112) + '提交状态不明确；未自动重新请求'
            : (_0x5671e2?.['batchId'] || _0x181112) + '请求失败；已保存状态',
        }),
          reportStoryAssetDiagnostics(diagnostics, 'story-asset-request', {
            ..._0x5671e2,
            status: 'failed',
            requestCount: _0x429444,
            elapsedMs: Math['max'](0x0, Date['now']() - _0x4e5e65),
            errorType: _0x4c650f['type'],
            errorMessage: _0x4c650f['message'],
          }));
        if (_0x5b4cc6)
          throw _0x2ecc29(
            'ASSET_SUBMISSION_AMBIGUOUS',
            _0x181112,
            _0x5671e2,
            (_0x5671e2?.['batchId'] || _0x181112) +
              '请求已提交但无法确认是否计费；需要明确授权后才能重新请求。',
          );
        throw _0x588518;
      }
      const _0x24d9ea = normalizeText(getResultText(_0x28e7b7)),
        _0x1dcbc7 = getStoryAssetResponseFinishReason(_0x28e7b7)['toLowerCase']();
      _0x9ad6a8['batchSubmissionRecords'][_0x181112] = {
        ..._0x9ad6a8['batchSubmissionRecords'][_0x181112],
        status: _0x24d9ea ? 'response-received' : 'blocked-paid-response',
        responseReceivedAt: Date['now'](),
        rawResponse: _0x24d9ea,
        ...(_0x1dcbc7 ? { finishReason: _0x1dcbc7 } : {}),
        ...(_0x24d9ea
          ? {}
          : {
              blockedAt: Date['now'](),
              errorType: 'empty-paid-response',
              errorMessage: '付费请求返回空内容。',
            }),
      };
      if (!_0x24d9ea) {
        ((_0x9ad6a8['status'] = 'blocked'),
          await _0x153924({
            stage: _0x5671e2?.['stage'],
            message: (_0x5671e2?.['batchId'] || _0x181112) + '付费请求返回空内容；已阻断且未自动重试',
          }),
          reportStoryAssetDiagnostics(diagnostics, 'story-asset-request', {
            ..._0x5671e2,
            status: 'failed',
            requestCount: _0x429444,
            elapsedMs: Math['max'](0x0, Date['now']() - _0x4e5e65),
            errorType: 'empty-paid-response',
            errorMessage: '付费请求返回空内容。',
          }));
        throw _0x2ecc29(
          'ASSET_PAID_RESULT_BLOCKED',
          _0x181112,
          _0x5671e2,
          (_0x5671e2?.['batchId'] || _0x181112) + '已付费但返回为空；需要明确授权后才能重新请求。',
        );
      }
      return (
        await _0x153924({
          stage: _0x5671e2?.['stage'],
          message: (_0x5671e2?.['batchId'] || _0x181112) + '已返回，正在校验付费结果',
        }),
        reportStoryAssetDiagnostics(diagnostics, 'story-asset-request', {
          ..._0x5671e2,
          status: 'succeeded',
          requestCount: _0x429444,
          elapsedMs: Math['max'](0x0, Date['now']() - _0x4e5e65),
          responseCharacters: _0x24d9ea['length'],
        }),
        _0x28e7b7
      );
    },
    _0x27e695 = (_0x208465) => {
      if (!_0x9ad6a8['batchSubmissionRecords'][_0x208465]) return;
      _0x9ad6a8['batchSubmissionRecords'][_0x208465] = {
        ..._0x9ad6a8['batchSubmissionRecords'][_0x208465],
        status: 'validated',
        validatedAt: Date['now'](),
      };
    },
    _0x428c0d = async (_0x55bff4, _0x3b9f9b, _0x7aea17) => {
      const _0x217c02 = _0x9ad6a8['batchSubmissionRecords'][_0x55bff4];
      if (!_0x217c02 || !normalizeText(_0x217c02['rawResponse'])) throw _0x7aea17;
      ((_0x217c02['status'] = 'blocked-paid-response'),
        (_0x217c02['errorType'] = classifyStoryAssetKindError(_0x7aea17)['type']),
        (_0x217c02['errorMessage'] = normalizeText(_0x7aea17?.['message'] || _0x7aea17)));
      const _0x1ba830 = normalizeText(_0x7aea17?.['finishReason'] || _0x217c02['finishReason'])[
        'toLowerCase'
      ]();
      if (_0x1ba830) _0x217c02['finishReason'] = _0x1ba830;
      ((_0x217c02['blockedAt'] = Date['now']()),
        (_0x9ad6a8['status'] = 'blocked'),
        await _0x153924({
          stage: _0x3b9f9b?.['stage'],
          message:
            (_0x3b9f9b?.['batchId'] || _0x55bff4) + '付费返回未通过合同校验；原始返回已保留，未自动重新请求',
        }));
      throw _0x2ecc29(
        'ASSET_PAID_RESULT_BLOCKED',
        _0x55bff4,
        _0x3b9f9b,
        (_0x3b9f9b?.['batchId'] || _0x55bff4) + '付费返回未通过合同校验；需要明确授权后才能重新请求。',
      );
    },
    _0x427886 = async ({ stage: _0x101a4b, message: _0x591438, remaining: _0xeb069d }) => {
      ((_0x9ad6a8['status'] = 'partial'), await _0x153924({ stage: _0x101a4b, message: _0x591438 }));
      throw createStoryAssetPipelineContinuation(_0x9ad6a8, _0x591438, _0xeb069d);
    },
    _0x57a84a = async (_0x4f9113, _0x4b0c91) => {
      if (!allowLocalBaselineFallback) {
        const _0x173348 = normalizeText(_0x4b0c91) || '资产清单 API 请求不可用';
        (_0x9ad6a8['failures']['push']({
          stage: 'inventory',
          batchId: _0x4f9113['id'],
          batchLabel: _0x4f9113['id'] + '（' + _0x4f9113['sourceScenes']['length'] + ' 场）',
          errorType: 'incomplete-ai-inventory',
          errorMessage: _0x173348,
          sourceSceneRefs: _0x4f9113['sourceScenes']['map']((_0x17fc41) => _0x17fc41['ref']),
        }),
          (_0x9ad6a8['status'] = 'failed'),
          await _0x153924({
            stage: 'inventory',
            message: _0x4f9113['id'] + '未获得完整\x20API\x20清单；已停止且不会使用本地候选冒充正式资产',
          }));
        throw createStoryAssetPipelineError(_0x9ad6a8['failures']);
      }
      const _0x336371 = createDeterministicStoryAssetInventory({
        project: project,
        sourceScenes: _0x4f9113['sourceScenes'],
      });
      (_0x9ad6a8['inventoryBatches']['push']({
        id: _0x4f9113['id'],
        status: 'succeeded',
        sourceSceneRefs: _0x4f9113['sourceScenes']['map']((_0x3e4945) => _0x3e4945['ref']),
        salvaged: ![],
        localFallback: !![],
        fallbackReason: normalizeText(_0x4b0c91) || '清单请求不可用，已使用本地确定性清单',
        inventory: _0x336371,
      }),
        await _0x153924({
          stage: 'inventory',
          message:
            _0x4f9113['id'] +
            '（' +
            _0x4f9113['sourceScenes']['length'] +
            ' 场）已使用本地确定性清单；后续不会为清单自动重试',
        }));
    },
    _0x5c1289 = (Array['isArray'](_0x9ad6a8['inventoryBatches']) ? _0x9ad6a8['inventoryBatches'] : [])[
      'filter'
    ](
      (_0x5bfee6) =>
        _0x5bfee6?.['status'] === 'succeeded' &&
        Array['isArray'](_0x5bfee6['sourceSceneRefs']) &&
        _0x5bfee6['inventory'],
    ),
    _0x1f8210 = new Set(_0x5c1289['flatMap']((_0x58f035) => _0x58f035['sourceSceneRefs'])),
    _0x41df66 = _0x92e8b['filter']((_0x10ed25) => !_0x1f8210['has'](_0x10ed25['ref']));
  if (_0x41df66['length']) {
    ((_0x9ad6a8['phase'] = 'inventory'),
      (_0x9ad6a8['status'] = 'in-progress'),
      (_0x9ad6a8['inventoryBatches'] = _0x5c1289),
      await _0x153924({
        stage: 'inventory',
        message: '正在建立轻量资产清单（已覆盖 ' + _0x1f8210['size'] + '/' + _0x92e8b['length'] + ' 场）',
      }));
    let _0x25977c = [];
    try {
      _0x25977c = createStoryAssetInventorySourceBatches({ project: project, sourceScenes: _0x41df66 })[
        'map'
      ]((_0x54780d, _0x1badfb) => ({ id: 'inventory-' + (_0x1badfb + 0x1), sourceScenes: _0x54780d }));
    } catch (_0x3b6e77) {
      _0x25977c = [
        {
          id: 'inventory-local-fallback',
          sourceScenes: _0x41df66,
          localFallbackReason: normalizeText(_0x3b6e77?.['message']) || '清单输入超过安全窗口',
        },
      ];
    }
    while (_0x25977c['length']) {
      const _0x471c18 = _0x25977c['shift'](),
        _0x2d17bf = _0x471c18['id'] + '（' + _0x471c18['sourceScenes']['length'] + ' 场）',
        _0xdfb904 = createStoryAssetBatchContractKey(
          'inventory',
          _0x471c18['sourceScenes']['map']((_0x496ae9) => _0x496ae9['ref']),
        ),
        _0xc362ec = {
          stage: 'inventory',
          batchId: _0x471c18['id'],
          batchKey: _0xdfb904,
          kinds: STORY_ASSET_EXPERIMENTAL_KINDS,
          contractIdentities: _0x471c18['sourceScenes']['map']((_0x18a338) => _0x18a338['ref']),
          sourceSceneCount: _0x471c18['sourceScenes']['length'],
        };
      !allowLocalBaselineFallback &&
        !_0x4b4c56 &&
        !_0x471c18['localFallbackReason'] &&
        _0x429444 >= _0x1f9cae &&
        (await _0x427886({
          stage: 'inventory',
          message:
            '本轮已完成\x20' +
            _0x429444 +
            '/' +
            _0x1f9cae +
            ' 次分批调用；仍有清单批次待处理，系统将自动继续',
          remaining: {
            phase: 'inventory',
            sourceSceneCount:
              _0x471c18['sourceScenes']['length'] +
              _0x25977c['reduce'](
                (_0x44874c, _0x3f3379) => _0x44874c + _0x3f3379['sourceScenes']['length'],
                0x0,
              ),
          },
        }));
      if (_0x4b4c56 || _0x471c18['localFallbackReason'] || _0x429444 >= _0x1f9cae) {
        await _0x57a84a(
          _0x471c18,
          _0x471c18['localFallbackReason'] || _0x39222a || '已达到本轮 ' + _0x1f9cae + '\x20次请求上限',
        );
        continue;
      }
      let _0x3b4e98 = null;
      try {
        const _0x1da913 = await _0x43c2d9(
          {
            model: _0xc16409,
            provider: _0x48bb0e,
            ...(_0x545d08 ? { providerProfileId: _0x545d08 } : {}),
            prompt: buildStoryAssetInventoryPrompt({
              project: project,
              sourceScenes: _0x471c18['sourceScenes'],
            }),
            systemPrompt: STORY_ASSET_INVENTORY_SYSTEM_PROMPT,
            structuredOutput: createStoryAssetInventoryStructuredOutput(),
            temperature: 0.1,
            timeoutMs: STORY_ASSET_EXPERIMENTAL_REQUEST_TIMEOUT_MS,
            maxOutputTokens: STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
            allowOversizedPrompt: !![],
          },
          _0xc362ec,
        );
        try {
          const _0x4f3024 = normalizeText(
            getStoryAssetResponseFinishReason(_0x1da913) ||
              _0x9ad6a8['batchSubmissionRecords'][_0xdfb904]?.['finishReason'],
          )['toLowerCase']();
          if (isStoryAssetResponseTruncated(_0x4f3024))
            throw Object['assign'](new Error(_0x2d17bf + '输出被截断。'), {
              type: 'OUTPUT_LENGTH',
              finishReason: _0x4f3024,
            });
          _0x3b4e98 = allowLocalBaselineFallback
            ? parseStoryAssetInventoryResultWithSalvage(_0x1da913, {
                sourceScenes: _0x471c18['sourceScenes'],
              })
            : parseStoryAssetInventoryResult(_0x1da913, {
                sourceScenes:
                  JSON['parse'](
                    _0x9ad6a8['batchSubmissionRecords'][_0xdfb904]?.['contractSnapshot']?.['prompt'] || '{}',
                  )['sourceScenes'] || _0x471c18['sourceScenes'],
              });
        } catch (_0x41ba24) {
          await _0x428c0d(_0xdfb904, _0xc362ec, _0x41ba24);
        }
      } catch (_0x55995d) {
        if (
          ['ASSET_SUBMISSION_AMBIGUOUS', 'ASSET_PAID_RESULT_BLOCKED', 'ASSET_EXTRACTION_CONTINUE_REQUIRED'][
            'includes'
          ](_0x55995d?.['type'])
        )
          throw _0x55995d;
        const _0x4a3627 = classifyStoryAssetKindError(_0x55995d);
        ((_0x4b4c56 = !![]),
          (_0x39222a =
            getStoryAssetKindErrorLabel(_0x4a3627['type'], _0x4a3627['message']) + '，已熔断后续请求'),
          await _0x57a84a(_0x471c18, _0x39222a));
        continue;
      }
      (_0x9ad6a8['inventoryBatches']['push']({
        id: _0x471c18['id'],
        status: 'succeeded',
        sourceSceneRefs: _0x471c18['sourceScenes']['map']((_0x57c7ad) => _0x57c7ad['ref']),
        salvaged: Boolean(_0x3b4e98['salvaged']),
        inventory: _0x3b4e98,
      }),
        _0x27e695(_0xdfb904),
        await _0x153924({
          stage: 'inventory',
          message: _0x2d17bf + '完成；本轮已调用\x20' + _0x429444 + '/' + _0x1f9cae + '\x20次',
        }));
    }
    const _0x154934 = new Set(
        _0x9ad6a8['inventoryBatches']['flatMap']((_0x127948) => _0x127948['sourceSceneRefs'] || []),
      ),
      _0x15c614 = _0x92e8b['map']((_0x492bc2) => _0x492bc2['ref'])['filter'](
        (_0x8ccda3) => !_0x154934['has'](_0x8ccda3),
      );
    if (_0x15c614['length']) {
      const _0x4f22f9 = new Set(_0x15c614);
      await _0x57a84a(
        {
          id: 'inventory-missing-local-fallback',
          sourceScenes: _0x92e8b['filter']((_0x19f62b) => _0x4f22f9['has'](_0x19f62b['ref'])),
        },
        '清单覆盖缺失，已使用本地确定性清单补齐',
      );
    }
  }
  if (!_0x9ad6a8['inventory']) {
    const _0x30eb94 = mergeStoryAssetInventoryResults(
      _0x9ad6a8['inventoryBatches']['map']((_0x59a803) => _0x59a803['inventory']),
      { sourceScenes: _0x92e8b },
    );
    _0x9ad6a8['inventory'] = _0x30eb94;
  }
  _0x9ad6a8['inventory'] = reconcileStoryAssetInventory(_0x9ad6a8['inventory'], {
    project: project,
    sourceScenes: _0x92e8b,
  });
  if (!allowLocalBaselineFallback) {
    const _0x2a0f11 = (_0x9ad6a8['inventory']?.['assets'] || [])['filter'](
      (_0x309c50) =>
        _0x309c50?.['kind'] === 'scene' && /[/／|｜]/u['test'](normalizeText(_0x309c50?.['name'])),
    );
    if (_0x2a0f11['length']) {
      (_0x9ad6a8['failures']['push']({
        stage: 'inventory',
        batchId: 'inventory-scene-quality-gate',
        batchLabel: '场景原子化校验',
        errorType: 'composite-scene-assets',
        errorMessage: '仍有\x20' + _0x2a0f11['length'] + '\x20个复合场景名',
        assetRefs: _0x2a0f11['map']((_0x326d2f) => _0x326d2f['ref']),
      }),
        (_0x9ad6a8['status'] = 'failed'),
        await _0x153924({
          stage: 'inventory',
          message:
            '场景清单仍包含 ' + _0x2a0f11['length'] + '\x20个复合地点；已停止且不会把复合标题写入正式资产',
        }));
      throw createStoryAssetPipelineError(_0x9ad6a8['failures']);
    }
  }
  reportStoryAssetDiagnostics(diagnostics, 'story-asset-candidate-ledger', {
    status: 'completed',
    ...(_0x9ad6a8['inventory']?.['candidateLedger']?.['summary'] || {}),
  });
  const _0x380921 = inspectStoryAssetInventoryCoverage(_0x9ad6a8['inventory'], _0x92e8b);
  _0x380921['length']
    ? ((_0x9ad6a8['inventory']['coverageWarnings'] = cloneStoryAssetExtractionValue(_0x380921)),
      reportStoryAssetDiagnostics(diagnostics, 'story-asset-coverage-warning', {
        status: 'fallback',
        issueCount: _0x380921['length'],
        issueTypes: normalizeStringArray(_0x380921['map']((_0x15df02) => _0x15df02['type'])),
      }))
    : delete _0x9ad6a8['inventory']['coverageWarnings'];
  const _0x55c21f = createStoryAssetDetailPlans({
      inventory: _0x9ad6a8['inventory'],
      sourceScenes: _0x92e8b,
      chapterIds: _0x42827c['chapterIds'],
    }),
    _0x36a808 = new Map(_0x55c21f['map']((_0x2c0925) => [_0x2c0925['ref'], _0x2c0925]));
  ((_0x9ad6a8['completedAssets'] = (
    Array['isArray'](_0x9ad6a8['completedAssets']) ? _0x9ad6a8['completedAssets'] : []
  )
    ['filter'](
      (_0x40d757) =>
        _0x36a808['has'](_0x40d757?.['ref']) &&
        (allowLocalBaselineFallback || normalizeText(_0x40d757?.['designStatus']) !== 'baseline'),
    )
    ['map']((_0x5f1cd3) => {
      const _0x8cc34b = _0x36a808['get'](_0x5f1cd3['ref']),
        _0x4b1f2d = new Map(_0x8cc34b['appearances']['map']((_0x3c2fef) => [_0x3c2fef['ref'], _0x3c2fef])),
        _0x4c2982 = (Array['isArray'](_0x5f1cd3?.['appearances']) ? _0x5f1cd3['appearances'] : [])
          ['filter']((_0x485f9c) => _0x4b1f2d['has'](_0x485f9c?.['ref']))
          ['map']((_0x16dfac) => {
            const _0x3d7308 = _0x4b1f2d['get'](_0x16dfac['ref']);
            return {
              ..._0x16dfac,
              name: _0x3d7308['name'],
              occurrences: _0x3d7308['occurrences'],
              sourceChapterIds: _0x3d7308['sourceEpisodeRefs'],
              sourceEpisodeRefs: _0x3d7308['sourceEpisodeRefs'],
              sourceSceneRefs: _0x3d7308['sourceSceneRefs'],
            };
          });
      return {
        ..._0x5f1cd3,
        kind: _0x8cc34b['kind'],
        name: _0x8cc34b['name'],
        role: _0x8cc34b['role'],
        occurrences: _0x8cc34b['occurrences'],
        prompt: _0x4c2982[0x0]?.['prompt'] || _0x5f1cd3['prompt'] || '',
        sourceChapterIds: _0x8cc34b['sourceEpisodeRefs'],
        sourceEpisodeRefs: _0x8cc34b['sourceEpisodeRefs'],
        sourceSceneRefs: _0x8cc34b['sourceSceneRefs'],
        appearances: _0x4c2982,
      };
    })),
    (_0x9ad6a8['detailBatches'] = Array['isArray'](_0x9ad6a8['detailBatches'])
      ? _0x9ad6a8['detailBatches']
      : []));
  const _0x5de858 = new Set(
    _0x9ad6a8['detailBatches']
      ['map']((_0x3963a7) => normalizeText(_0x3963a7?.['submissionBatchKey']))
      ['filter'](Boolean),
  );
  (Object['entries'](_0x9ad6a8['batchSubmissionRecords'])['forEach'](([_0x487781, _0xd1eabf]) => {
    if (
      normalizeText(_0xd1eabf?.['stage']) !== 'detail' ||
      !normalizeText(_0xd1eabf?.['rawResponse']) ||
      _0x5de858['has'](_0x487781)
    )
      return;
    let _0x159b3c = [];
    try {
      const _0x20653b = JSON['parse'](_0xd1eabf?.['contractSnapshot']?.['prompt'] || '{}');
      _0x159b3c = Array['isArray'](_0x20653b?.['assetPlans']) ? _0x20653b['assetPlans'] : [];
    } catch {
      return;
    }
    const _0x5bcd75 = _0x159b3c['map']((_0x5ba524) => _0x36a808['get'](normalizeText(_0x5ba524?.['ref'])))[
        'filter'
      ](Boolean),
      _0x4ba22 = _0x159b3c['map']((_0x22cb08) => normalizeText(_0x22cb08?.['ref']))['filter'](
        (_0x400157) => _0x400157 && !_0x36a808['has'](_0x400157),
      );
    if (!_0x5bcd75['length'] || !_0x4ba22['length']) return;
    const _0x4ad7b5 = salvageStoryAssetDetailBatchResult(_0xd1eabf['rawResponse'], {
        assetPlans: _0x5bcd75,
        chapterIds: _0x42827c['chapterIds'],
        visualStyle: _0x46d60e,
      }),
      _0x9bf21a = new Set(_0x4ad7b5['map']((_0x26b7e6) => _0x26b7e6['ref']));
    if (!_0x5bcd75['every']((_0x312922) => _0x9bf21a['has'](_0x312922['ref']))) return;
    ((_0x9ad6a8['completedAssets'] = [
      ..._0x9ad6a8['completedAssets']['filter']((_0xa9ce4a) => !_0x9bf21a['has'](_0xa9ce4a['ref'])),
      ..._0x4ad7b5,
    ]),
      _0x9ad6a8['detailBatches']['push']({
        id:
          normalizeText(_0xd1eabf?.['batchId']) ||
          'detail-recovered-' + (_0x9ad6a8['detailBatches']['length'] + 0x1),
        status: 'succeeded',
        assetRefs: _0x5bcd75['map']((_0xef7452) => _0xef7452['ref']),
        completedAssetRefs: _0x4ad7b5['map']((_0x1ade3a) => _0x1ade3a['ref']),
        fallbackAssetRefs: [],
        recoveredFromSavedResponse: !![],
        submissionBatchKey: _0x487781,
        reconciledRemovedAssetRefs: _0x4ba22,
      }),
      (_0x9ad6a8['batchSubmissionRecords'][_0x487781] = {
        ..._0xd1eabf,
        status: 'validated',
        validatedAt: Date['now'](),
        recoveredFromSavedResponse: !![],
        reconciledRemovedAssetRefs: _0x4ba22,
      }),
      _0x5de858['add'](_0x487781));
  }),
    _0x9ad6a8['detailBatches']['forEach']((_0xd0491a) => {
      const _0x391b12 = normalizeText(_0xd0491a?.['rawResponse']);
      if (!_0x391b12 || _0xd0491a?.['status'] === 'succeeded') return;
      const _0x5d7fcb = normalizeStringArray(_0xd0491a?.['assetRefs'])
        ['map']((_0x345311) => _0x36a808['get'](_0x345311))
        ['filter'](Boolean);
      if (!_0x5d7fcb['length']) return;
      const _0x3857c3 = salvageStoryAssetDetailBatchResult(_0x391b12, {
          assetPlans: _0x5d7fcb,
          chapterIds: _0x42827c['chapterIds'],
          visualStyle: _0x46d60e,
        }),
        _0x265128 = new Set(_0x3857c3['map']((_0x28e008) => _0x28e008['ref'])),
        _0x1e4e06 = allowLocalBaselineFallback
          ? createStoryAssetBaselineDetailAssets(
              _0x5d7fcb['filter']((_0x2a9f99) => !_0x265128['has'](_0x2a9f99['ref'])),
              { sourceScenes: _0x92e8b, visualStyle: _0x46d60e },
            )
          : [],
        _0x55ccd6 = [..._0x3857c3, ..._0x1e4e06];
      if (!_0x55ccd6['length']) return;
      const _0x369564 = new Set(_0x55ccd6['map']((_0x1331f7) => _0x1331f7['ref']));
      ((_0x9ad6a8['completedAssets'] = [
        ..._0x9ad6a8['completedAssets']['filter']((_0x515b6b) => !_0x369564['has'](_0x515b6b['ref'])),
        ..._0x55ccd6,
      ]),
        (_0xd0491a['completedAssetRefs'] = normalizeStringArray([
          ...(_0xd0491a['completedAssetRefs'] || []),
          ..._0x369564,
        ])),
        (_0xd0491a['fallbackAssetRefs'] = normalizeStringArray([
          ...(_0xd0491a['fallbackAssetRefs'] || []),
          ..._0x1e4e06['map']((_0x146b6f) => _0x146b6f['ref']),
        ])),
        (_0xd0491a['status'] = _0x5d7fcb['every']((_0x198e9c) => _0x369564['has'](_0x198e9c['ref']))
          ? 'succeeded'
          : 'partial'),
        (_0xd0491a['recoveredFromSavedResponse'] = !![]));
      if (_0xd0491a['status'] === 'succeeded') delete _0xd0491a['rawResponse'];
    }));
  const _0x28babc = new Set(_0x9ad6a8['completedAssets']['map']((_0x4bd75a) => _0x4bd75a['ref'])),
    _0x32fa3a = _0x55c21f['filter']((_0x1cc2ad) => !_0x28babc['has'](_0x1cc2ad['ref']));
  let _0x15a8ef = [],
    _0x48ce30 = null;
  try {
    _0x15a8ef = createStoryAssetDetailPromptBatches(_0x32fa3a, {
      project: project,
      sourceScenes: _0x92e8b,
      aspectRatio: aspectRatio,
      visualStyle: _0x46d60e,
      estimateByKind: _0x9ad6a8['outputEstimates'],
    });
  } catch (_0x12d830) {
    _0x48ce30 = _0x12d830;
  }
  const _0x51c94e = _0x9ad6a8['detailBatches']['length'],
    _0x3ef312 = async ({
      batchPlans: _0xd26bfc,
      batchId: _0x444638,
      fallbackReason: _0x178a6c,
      message: _0x18c98b,
    }) => {
      if (!allowLocalBaselineFallback) {
        const _0x198577 = normalizeText(_0x178a6c) || '资产视觉细化 API 请求不可用';
        (_0x9ad6a8['detailBatches']['push']({
          id: _0x444638,
          status: 'failed',
          assetRefs: _0xd26bfc['map']((_0x2eb1dd) => _0x2eb1dd['ref']),
          completedAssetRefs: [],
          fallbackAssetRefs: [],
          errorMessage: _0x198577,
        }),
          _0x9ad6a8['failures']['push']({
            stage: 'detail',
            batchId: _0x444638,
            batchLabel: _0x444638 + '（' + _0xd26bfc['length'] + '\x20个资产）',
            errorType: 'incomplete-ai-detail',
            errorMessage: _0x198577,
            assetRefs: _0xd26bfc['map']((_0x3ce45a) => _0x3ce45a['ref']),
          }),
          (_0x9ad6a8['status'] = _0x9ad6a8['completedAssets']['length'] ? 'partial' : 'failed'),
          await _0x153924({ stage: 'detail', message: _0x18c98b + '；已停止且不会生成本地假提示词' }));
        throw createStoryAssetPipelineError(_0x9ad6a8['failures']);
      }
      const _0x10af9c = createStoryAssetBaselineDetailAssets(_0xd26bfc, {
          sourceScenes: _0x92e8b,
          visualStyle: _0x46d60e,
        }),
        _0x40244e = new Set(_0x10af9c['map']((_0x5b6de5) => _0x5b6de5['ref']));
      ((_0x9ad6a8['completedAssets'] = [
        ..._0x9ad6a8['completedAssets']['filter']((_0x969bb4) => !_0x40244e['has'](_0x969bb4['ref'])),
        ..._0x10af9c,
      ]),
        _0x9ad6a8['detailBatches']['push']({
          id: _0x444638,
          status: 'succeeded',
          assetRefs: _0xd26bfc['map']((_0x7d6c5) => _0x7d6c5['ref']),
          completedAssetRefs: _0x10af9c['map']((_0x32e989) => _0x32e989['ref']),
          fallbackAssetRefs: _0x10af9c['map']((_0x2fb3ae) => _0x2fb3ae['ref']),
          fallbackReason: _0x178a6c,
          circuitBreakerFallback: !![],
        }),
        await _0x153924({ stage: 'detail', message: _0x18c98b }));
    };
  _0x32fa3a['length'] &&
    ((_0x9ad6a8['phase'] = 'detail'),
    (_0x9ad6a8['status'] = 'in-progress'),
    await _0x153924({
      stage: 'detail',
      message:
        '正在按资产证据生成描述与图片提示词（已完成 ' +
        _0x28babc['size'] +
        '/' +
        _0x55c21f['length'] +
        ' 个）',
    }));
  _0x32fa3a['length'] &&
    _0x48ce30 &&
    (await _0x3ef312({
      batchPlans: _0x32fa3a,
      batchId: 'detail-' + (_0x51c94e + 0x1),
      fallbackReason: normalizeText(_0x48ce30?.['message']) || '资产证据超过安全窗口',
      message:
        '资产证据超过安全窗口，已在本地生成\x20' + _0x32fa3a['length'] + '\x20个基础设定，不会扩大请求',
    }));
  for (let _0x57818c = 0x0; _0x57818c < _0x15a8ef['length']; _0x57818c += 0x1) {
    const _0x126aa1 = _0x15a8ef[_0x57818c],
      _0x5612cf = 'detail-' + (_0x51c94e + _0x57818c + 0x1),
      _0x3fb578 = _0x5612cf + '（' + _0x126aa1['length'] + '\x20个资产）',
      _0x310410 = createStoryAssetBatchContractKey(
        'detail',
        _0x126aa1['map']((_0x450276) => _0x450276['kind'] + ':' + _0x450276['ref'] + ':' + _0x450276['name']),
      ),
      _0x200ee2 = {
        stage: 'detail',
        batchId: _0x5612cf,
        batchKey: _0x310410,
        kinds: normalizeStringArray(_0x126aa1['map']((_0x54235c) => _0x54235c['kind'])),
        contractIdentities: _0x126aa1['map'](
          (_0x6ddae) => _0x6ddae['kind'] + ':' + _0x6ddae['ref'] + ':' + _0x6ddae['name'],
        ),
        assetCount: _0x126aa1['length'],
        sourceSceneCount: selectStoryAssetDetailSourceScenes(_0x126aa1, _0x92e8b)['length'],
      };
    !allowLocalBaselineFallback &&
      !_0x4b4c56 &&
      _0x429444 >= _0x1f9cae &&
      (await _0x427886({
        stage: 'detail',
        message:
          '本轮已完成\x20' +
          _0x429444 +
          '/' +
          _0x1f9cae +
          ' 次分批调用；仍有提示词批次待处理，系统将自动继续',
        remaining: {
          phase: 'detail',
          assetCount: _0x15a8ef['slice'](_0x57818c)['reduce'](
            (_0xfd3640, _0x3f3cfb) => _0xfd3640 + _0x3f3cfb['length'],
            0x0,
          ),
          batchCount: _0x15a8ef['length'] - _0x57818c,
        },
      }));
    if (_0x4b4c56) {
      await _0x3ef312({
        batchPlans: _0x126aa1,
        batchId: _0x5612cf,
        fallbackReason: _0x39222a || '前序请求失败，熔断后未继续调用\x20API',
        message:
          _0x3fb578 +
          '已跳过 API，使用本地基础设定补齐；已完成 ' +
          (_0x9ad6a8['completedAssets']['length'] + _0x126aa1['length']) +
          '/' +
          _0x55c21f['length'] +
          '\x20个资产',
      });
      continue;
    }
    let _0x37bd8d = null;
    try {
      _0x37bd8d = await _0x43c2d9(
        {
          model: _0xc16409,
          provider: _0x48bb0e,
          ...(_0x545d08 ? { providerProfileId: _0x545d08 } : {}),
          prompt: buildStoryAssetDetailBatchPrompt({
            project: project,
            sourceScenes: _0x92e8b,
            batches: _0x15a8ef,
            batchIndex: _0x57818c,
            aspectRatio: aspectRatio,
            visualStyle: _0x46d60e,
          }),
          systemPrompt: STORY_ASSET_DETAIL_SYSTEM_PROMPT,
          structuredOutput: createStoryAssetDetailStructuredOutput(_0x57818c, _0x126aa1),
          thinking: { type: 'disabled' },
          temperature: 0.2,
          timeoutMs: STORY_ASSET_EXPERIMENTAL_REQUEST_TIMEOUT_MS,
          maxOutputTokens: STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
        },
        _0x200ee2,
      );
      const _0x42fd50 = normalizeText(
        getStoryAssetResponseFinishReason(_0x37bd8d) ||
          _0x9ad6a8['batchSubmissionRecords'][_0x310410]?.['finishReason'],
      )['toLowerCase']();
      let _0x1366d7 = [],
        _0x2bab87 = null;
      if (!allowLocalBaselineFallback)
        try {
          if (isStoryAssetResponseTruncated(_0x42fd50))
            throw Object['assign'](new Error(_0x3fb578 + '输出被截断。'), {
              type: 'OUTPUT_LENGTH',
              finishReason: _0x42fd50,
            });
          const _0x202476 = JSON['parse'](
            _0x9ad6a8['batchSubmissionRecords'][_0x310410]?.['contractSnapshot']?.['prompt'] || '{}',
          );
          _0x1366d7 = parseStoryAssetDetailBatchResult(_0x37bd8d, {
            assetPlans: Array['isArray'](_0x202476?.['assetPlans']) ? _0x202476['assetPlans'] : _0x126aa1,
            chapterIds: _0x42827c['chapterIds'],
            visualStyle: _0x46d60e,
          });
        } catch (_0x3b5811) {
          await _0x428c0d(_0x310410, _0x200ee2, _0x3b5811);
        }
      else
        try {
          if (isStoryAssetResponseTruncated(_0x42fd50))
            throw Object['assign'](new Error(_0x3fb578 + '输出被截断。'), {
              type: 'OUTPUT_LENGTH',
              finishReason: _0x42fd50,
            });
          _0x1366d7 = parseStoryAssetDetailBatchResult(_0x37bd8d, {
            assetPlans: _0x126aa1,
            chapterIds: _0x42827c['chapterIds'],
            visualStyle: _0x46d60e,
          });
        } catch (_0x17d204) {
          ((_0x2bab87 = _0x17d204),
            (_0x1366d7 = salvageStoryAssetDetailBatchResult(_0x37bd8d, {
              assetPlans: _0x126aa1,
              chapterIds: _0x42827c['chapterIds'],
              visualStyle: _0x46d60e,
            })));
        }
      const _0x1b2da1 = _0x1366d7,
        _0x4c9e15 = new Set(_0x1366d7['map']((_0x5ce84e) => _0x5ce84e['ref'])),
        _0x5cae33 = allowLocalBaselineFallback
          ? createStoryAssetBaselineDetailAssets(
              _0x126aa1['filter']((_0x1e5913) => !_0x4c9e15['has'](_0x1e5913['ref'])),
              { sourceScenes: _0x92e8b, visualStyle: _0x46d60e },
            )
          : [],
        _0x494697 = Boolean(_0x2bab87 || _0x5cae33['length']);
      _0x1366d7 = [..._0x1366d7, ..._0x5cae33];
      if (_0x1366d7['length']) {
        const _0x5a8091 = new Set(_0x1366d7['map']((_0x2b7ee9) => _0x2b7ee9['ref']));
        ((_0x9ad6a8['completedAssets'] = [
          ..._0x9ad6a8['completedAssets']['filter']((_0x316751) => !_0x5a8091['has'](_0x316751['ref'])),
          ..._0x1366d7,
        ]),
          (_0x9ad6a8['outputEstimates'] = updateStoryAssetOutputEstimates(
            _0x9ad6a8['outputEstimates'],
            _0x1b2da1,
          )));
      }
      const _0x2c1742 = new Set(_0x1366d7['map']((_0x53291a) => _0x53291a['ref'])),
        _0xd3e910 = _0x126aa1['filter']((_0x216c38) => !_0x2c1742['has'](_0x216c38['ref'])),
        _0x44d01f = _0xd3e910['length'] > 0x0;
      (_0x9ad6a8['detailBatches']['push']({
        id: _0x5612cf,
        status: _0x494697 || _0xd3e910['length'] ? 'partial' : 'succeeded',
        assetRefs: _0x126aa1['map']((_0x1ef798) => _0x1ef798['ref']),
        completedAssetRefs: _0x1366d7['map']((_0x55aad4) => _0x55aad4['ref']),
        fallbackAssetRefs: _0x5cae33['map']((_0xb33a34) => _0xb33a34['ref']),
        ...(_0x5cae33['length']
          ? {
              fallbackReason:
                normalizeText(_0x2bab87?.['message']) || 'AI 响应缺少 ' + _0x5cae33['length'] + ' 个资产',
            }
          : {}),
        ...(_0x44d01f || _0x494697
          ? { rawResponse: normalizeText(getResultText(_0x37bd8d)), finishReason: _0x42fd50 }
          : {}),
      }),
        _0x27e695(_0x310410));
      _0x494697 &&
        ((_0x4b4c56 = !![]),
        (_0x39222a =
          (normalizeText(_0x2bab87?.['message']) ||
            'AI\x20响应缺少\x20' + _0x5cae33['length'] + '\x20个资产') + '，已熔断后续细化请求'));
      if (_0x494697 && !allowLocalBaselineFallback)
        throw (
          _0x2bab87 ||
          new Error(
            _0x3fb578 + '缺少\x20' + (_0x126aa1['length'] - _0x1b2da1['length']) + ' 个完整 API 资产结果。',
          )
        );
      if (_0xd3e910['length'])
        throw _0x2bab87 || new Error(_0x3fb578 + '缺少\x20' + _0xd3e910['length'] + ' 个资产结果。');
      await _0x153924({
        stage: 'detail',
        message: _0x494697
          ? _0x3fb578 +
            '响应不完整，已本地补齐并熔断后续 API；已完成 ' +
            _0x9ad6a8['completedAssets']['length'] +
            '/' +
            _0x55c21f['length'] +
            ' 个资产'
          : _0x3fb578 +
            '完成；已完成 ' +
            _0x9ad6a8['completedAssets']['length'] +
            '/' +
            _0x55c21f['length'] +
            '\x20个资产，本轮已调用\x20' +
            _0x429444 +
            '/' +
            _0x1f9cae +
            '\x20次',
      });
    } catch (_0x35ec3b) {
      if (
        ['ASSET_SUBMISSION_AMBIGUOUS', 'ASSET_PAID_RESULT_BLOCKED', 'ASSET_EXTRACTION_CONTINUE_REQUIRED'][
          'includes'
        ](_0x35ec3b?.['type'])
      )
        throw _0x35ec3b;
      const _0x4317b2 = classifyStoryAssetKindError(_0x35ec3b);
      if (_0x37bd8d === null) {
        _0x4b4c56 = !![];
        const _0x376c3f = getStoryAssetKindErrorLabel(_0x4317b2['type'], _0x4317b2['message']);
        ((_0x39222a = _0x376c3f + '，已熔断后续细化请求'),
          await _0x3ef312({
            batchPlans: _0x126aa1,
            batchId: _0x5612cf,
            fallbackReason: _0x39222a,
            message: '' + _0x3fb578 + _0x376c3f + '；本批改用本地基础设定，后续批次不再调用 API',
          }));
        continue;
      }
      (_0x9ad6a8['failures']['push']({
        stage: 'detail',
        batchId: _0x5612cf,
        batchLabel: _0x3fb578,
        errorType: _0x4317b2['type'],
        errorMessage: _0x4317b2['message'],
        assetRefs: _0x126aa1['map']((_0x4d12b1) => _0x4d12b1['ref']),
      }),
        (_0x9ad6a8['status'] = _0x9ad6a8['completedAssets']['length'] ? 'partial' : 'failed'),
        await _0x153924({
          stage: 'detail',
          message:
            '' +
            _0x3fb578 +
            getStoryAssetKindErrorLabel(_0x4317b2['type'], _0x4317b2['message']) +
            '；已保存本批可解析结果，未自动重试',
        }));
      throw createStoryAssetPipelineError(_0x9ad6a8['failures']);
    }
  }
  if (!allowLocalBaselineFallback) {
    const _0xe16ab6 = new Set(
        _0x9ad6a8['completedAssets']
          ['filter']((_0x51c75a) => normalizeText(_0x51c75a?.['designStatus']) !== 'baseline')
          ['map']((_0x71544f) => _0x71544f['ref']),
      ),
      _0x57b955 = _0x55c21f['filter']((_0x2a2eae) => !_0xe16ab6['has'](_0x2a2eae['ref']));
    if (_0x57b955['length']) {
      (_0x9ad6a8['failures']['push']({
        stage: 'detail',
        batchId: 'detail-quality-gate',
        batchLabel: 'API 视觉细化完整性校验',
        errorType: 'incomplete-ai-detail',
        errorMessage: '仍有\x20' + _0x57b955['length'] + ' 个资产没有完整 API 视觉结果',
        assetRefs: _0x57b955['map']((_0x4fd3bc) => _0x4fd3bc['ref']),
      }),
        (_0x9ad6a8['status'] = _0x9ad6a8['completedAssets']['length'] ? 'partial' : 'failed'),
        await _0x153924({
          stage: 'detail',
          message:
            '仍有 ' +
            _0x57b955['length'] +
            '\x20个资产没有完整\x20API\x20视觉结果；已停止且不会写入本地假提示词',
        }));
      throw createStoryAssetPipelineError(_0x9ad6a8['failures']);
    }
  }
  return (
    _0x9ad6a8['completedAssets']['sort'](
      (_0x2261e6, _0x488479) =>
        _0x55c21f['findIndex']((_0x5171e0) => _0x5171e0['ref'] === _0x2261e6['ref']) -
        _0x55c21f['findIndex']((_0x46c6ae) => _0x46c6ae['ref'] === _0x488479['ref']),
    ),
    (_0x9ad6a8['completedAssets'] = _0x9ad6a8['completedAssets']['map']((_0x52d641) =>
      sanitizeStoryAssetPublicAsset(_0x52d641, { visualStyle: _0x46d60e }),
    )),
    (_0x9ad6a8['phase'] = 'detail'),
    (_0x9ad6a8['status'] = 'completed'),
    (_0x9ad6a8['failures'] = []),
    await _0x153924({
      stage: 'detail',
      message:
        '资产提取完成：' +
        _0x9ad6a8['completedAssets']['length'] +
        ' 个资产，本轮分批调用 ' +
        _0x429444 +
        ' 次；每个请求仅执行一次',
    }),
    {
      schemaVersion: STORY_ASSET_EXTRACTION_SCHEMA_VERSION,
      extractionStrategy: 'evidence-batched-api',
      assets: _0x9ad6a8['completedAssets'],
      candidateLedger: cloneStoryAssetExtractionValue(_0x9ad6a8['inventory']?.['candidateLedger']),
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
  const _0x59439e = normalizeText(model),
    _0x2af464 = normalizeText(provider),
    _0x485ade = normalizeText(providerProfileId);
  if (!_0x59439e || !_0x2af464) throw new Error('请先选择可用的文本模型。');
  const _0x2206f1 = normalizeStoryContext(project),
    _0x2d54f3 = normalizeStoryAssetExtractionSources(episodes),
    _0x3ac7d3 = normalizeText(visualStyle) || _0x2206f1['visualStyle'],
    _0x316148 = createStoryAssetExtractionFingerprint({
      storyContext: _0x2206f1,
      sourceScenes: _0x2d54f3,
      model: _0x59439e,
      provider: _0x2af464,
      providerProfileId: _0x485ade,
      aspectRatio: aspectRatio,
      visualStyle: _0x3ac7d3,
    }),
    _0x22dd79 = createStoryAssetExtractionContentFingerprint({
      storyContext: _0x2206f1,
      sourceScenes: _0x2d54f3,
      aspectRatio: aspectRatio,
      visualStyle: _0x3ac7d3,
    }),
    _0x3f96ac = restoreStoryAssetPipelineDraft(resumeDraft, {
      sourceFingerprint: _0x316148,
      sourceContentFingerprint: _0x22dd79,
    }),
    _0x169115 = Object['fromEntries'](
      STORY_ASSET_EXPERIMENTAL_KINDS['map']((_0x4796a9) => [
        _0x4796a9,
        {
          kind: _0x4796a9,
          status: 'pending',
          attempt: 0x0,
          assetCount: 0x0,
          errorType: '',
          errorMessage: '',
          startedAt: 0x0,
          finishedAt: 0x0,
        },
      ]),
    );
  let _0x428af5 = _0x3f96ac || {
    strategy: STORY_ASSET_EXTRACTION_DRAFT_STRATEGY,
    schemaVersion: STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION,
    sourceFingerprint: _0x316148,
    sourceContentFingerprint: _0x22dd79,
    status: 'pending',
    phase: 'kind',
    assetsByKind: Object['fromEntries'](
      STORY_ASSET_EXPERIMENTAL_KINDS['map']((_0x593c09) => [_0x593c09, []]),
    ),
    kindStates: _0x169115,
    completedKinds: [],
    completedAssets: [],
    failures: [],
    totalRequestCount: 0x0,
  };
  ((_0x428af5['strategy'] = STORY_ASSET_EXTRACTION_DRAFT_STRATEGY),
    (_0x428af5['schemaVersion'] = STORY_ASSET_BATCHED_EXTRACTION_SCHEMA_VERSION),
    (_0x428af5['sourceFingerprint'] = _0x316148),
    (_0x428af5['sourceContentFingerprint'] = _0x22dd79),
    (_0x428af5['phase'] = 'kind'),
    (_0x428af5['assetsByKind'] =
      _0x428af5['assetsByKind'] && typeof _0x428af5['assetsByKind'] === 'object'
        ? _0x428af5['assetsByKind']
        : {}),
    (_0x428af5['kindStates'] =
      _0x428af5['kindStates'] && typeof _0x428af5['kindStates'] === 'object' ? _0x428af5['kindStates'] : {}),
    STORY_ASSET_EXPERIMENTAL_KINDS['forEach']((_0x2dfa88) => {
      if (!Array['isArray'](_0x428af5['assetsByKind'][_0x2dfa88])) _0x428af5['assetsByKind'][_0x2dfa88] = [];
      _0x428af5['kindStates'][_0x2dfa88] = {
        ..._0x169115[_0x2dfa88],
        ...(_0x428af5['kindStates'][_0x2dfa88] || {}),
        kind: _0x2dfa88,
      };
    }),
    (_0x428af5['completedKinds'] = STORY_ASSET_EXPERIMENTAL_KINDS['filter'](
      (_0x195de8) => _0x428af5['kindStates'][_0x195de8]?.['status'] === 'succeeded',
    )),
    (_0x428af5['failures'] = []),
    (_0x428af5['runRequestCount'] = 0x0));
  let _0x26c844 = 0x0;
  const _0x3690db = async (_0x5a1535 = '') => {
      ((_0x428af5['completedKinds'] = STORY_ASSET_EXPERIMENTAL_KINDS['filter'](
        (_0x44c7a0) => _0x428af5['kindStates'][_0x44c7a0]?.['status'] === 'succeeded',
      )),
        _0x428af5['status'] !== 'completed' &&
          (_0x428af5['completedAssets'] = STORY_ASSET_EXPERIMENTAL_KINDS['flatMap'](
            (_0x2c2650) => _0x428af5['assetsByKind'][_0x2c2650] || [],
          )),
        (_0x428af5['progress'] = {
          stage: 'kind',
          current: _0x428af5['completedKinds']['length'],
          total: STORY_ASSET_EXPERIMENTAL_KINDS['length'],
          message: _0x5a1535,
          requestCount: _0x26c844,
        }),
        (_0x428af5 = await saveStoryAssetExtractionCheckpoint(_0x428af5, onCheckpoint)),
        onProgress?.({
          stage: 'extracting-asset-kinds',
          current: _0x428af5['progress']['current'],
          total: _0x428af5['progress']['total'],
          message: _0x5a1535,
        }));
    },
    _0x1a8d46 = async (_0x13a652) => {
      ((_0x26c844 += 0x1),
        (_0x428af5['runRequestCount'] = _0x26c844),
        (_0x428af5['totalRequestCount'] =
          Math['max'](0x0, Number(_0x428af5['totalRequestCount']) || 0x0) + 0x1));
      const _0x5d9880 = buildStoryAssetKindExtractionPrompt({
          project: project,
          sourceScenes: _0x2d54f3,
          kind: _0x13a652,
          aspectRatio: aspectRatio,
          visualStyle: _0x3ac7d3,
        }),
        _0x559e69 = Date['now']();
      reportStoryAssetDiagnostics(diagnostics, 'story-asset-request', {
        stage: 'kind',
        kind: _0x13a652,
        status: 'started',
        requestCount: _0x26c844,
        promptCharacters: _0x5d9880['length'],
        sourceSceneCount: _0x2d54f3['length'],
      });
      try {
        const _0x412495 = await request({
            model: _0x59439e,
            provider: _0x2af464,
            ...(_0x485ade ? { providerProfileId: _0x485ade } : {}),
            prompt: _0x5d9880,
            systemPrompt: buildStoryAssetKindSystemPrompt(_0x13a652),
            structuredOutput: createStoryAssetKindStructuredOutput(_0x13a652),
            thinking: { type: 'disabled' },
            temperature: 0.1,
            timeoutMs: STORY_ASSET_EXPERIMENTAL_REQUEST_TIMEOUT_MS,
            maxOutputTokens: STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
            allowOversizedPrompt: !![],
          }),
          _0x3af797 = getStoryAssetResponseFinishReason(_0x412495)['toLowerCase']();
        if (isStoryAssetResponseTruncated(_0x3af797))
          throw Object['assign'](new Error(STORY_ASSET_KIND_LABELS[_0x13a652] + '输出被截断。'), {
            type: 'OUTPUT_LENGTH',
            finishReason: _0x3af797,
          });
        return (
          reportStoryAssetDiagnostics(diagnostics, 'story-asset-request', {
            stage: 'kind',
            kind: _0x13a652,
            status: 'succeeded',
            requestCount: _0x26c844,
            elapsedMs: Math['max'](0x0, Date['now']() - _0x559e69),
            responseCharacters: normalizeText(getResultText(_0x412495))['length'],
          }),
          _0x412495
        );
      } catch (_0x25ec28) {
        const _0x599282 = classifyStoryAssetKindError(_0x25ec28);
        reportStoryAssetDiagnostics(diagnostics, 'story-asset-request', {
          stage: 'kind',
          kind: _0x13a652,
          status: 'failed',
          requestCount: _0x26c844,
          elapsedMs: Math['max'](0x0, Date['now']() - _0x559e69),
          errorType: _0x599282['type'],
          errorMessage: _0x599282['message'],
        });
        throw _0x25ec28;
      }
    };
  ((_0x428af5['status'] = 'in-progress'),
    await _0x3690db(
      '正在按输出域提取资产（已完成 ' +
        _0x428af5['completedKinds']['length'] +
        '/' +
        STORY_ASSET_EXPERIMENTAL_KINDS['length'] +
        '）',
    ));
  for (const _0x6c86a8 of STORY_ASSET_EXPERIMENTAL_KINDS) {
    if (_0x428af5['kindStates'][_0x6c86a8]?.['status'] === 'succeeded') continue;
    const _0x13b3f9 = Date['now']();
    ((_0x428af5['kindStates'][_0x6c86a8] = {
      ..._0x428af5['kindStates'][_0x6c86a8],
      kind: _0x6c86a8,
      status: 'running',
      attempt:
        Math['max'](0x0, Math['trunc'](Number(_0x428af5['kindStates'][_0x6c86a8]?.['attempt']) || 0x0)) + 0x1,
      assetCount: 0x0,
      errorType: '',
      errorMessage: '',
      startedAt: _0x13b3f9,
      finishedAt: 0x0,
    }),
      await _0x3690db('正在提取' + STORY_ASSET_KIND_LABELS[_0x6c86a8] + '；完整剧本输入保持不变'));
    try {
      const _0x4eed3e = await _0x1a8d46(_0x6c86a8),
        _0x5900da = parseStoryAssetKindExtractionResult(_0x4eed3e, {
          kind: _0x6c86a8,
          sourceScenes: _0x2d54f3,
          chapterIds: _0x2206f1['chapterIds'],
          visualStyle: _0x3ac7d3,
        });
      ((_0x428af5['assetsByKind'][_0x6c86a8] = _0x5900da['assets']),
        (_0x428af5['kindStates'][_0x6c86a8] = {
          ..._0x428af5['kindStates'][_0x6c86a8],
          status: 'succeeded',
          assetCount: _0x5900da['assets']['length'],
          errorType: '',
          errorMessage: '',
          finishedAt: Date['now'](),
        }),
        await _0x3690db(
          STORY_ASSET_KIND_LABELS[_0x6c86a8] + '完成：' + _0x5900da['assets']['length'] + '\x20个',
        ));
    } catch (_0xfcbc58) {
      const _0x57c870 = classifyStoryAssetKindError(_0xfcbc58);
      ((_0x428af5['kindStates'][_0x6c86a8] = {
        ..._0x428af5['kindStates'][_0x6c86a8],
        status: 'failed',
        assetCount: 0x0,
        errorType: _0x57c870['type'],
        errorMessage: _0x57c870['message'],
        finishedAt: Date['now'](),
      }),
        (_0x428af5['failures'] = [
          {
            stage: 'kind',
            kind: _0x6c86a8,
            errorType: _0x57c870['type'],
            errorMessage: _0x57c870['message'],
          },
        ]),
        (_0x428af5['status'] = _0x428af5['completedKinds']['length'] ? 'partial' : 'failed'),
        await _0x3690db(
          '' +
            STORY_ASSET_KIND_LABELS[_0x6c86a8] +
            getStoryAssetKindErrorLabel(_0x57c870['type'], _0x57c870['message']) +
            '；未自动重试',
        ));
      throw createStoryAssetPipelineError(_0x428af5['failures']);
    }
  }
  const _0x13bcaa = normalizeStringArray(_0x2d54f3['flatMap']((_0x3dafb2) => _0x3dafb2['characters'] || [])),
    _0x111ffe = STORY_ASSET_EXPERIMENTAL_KINDS['flatMap'](
      (_0x523768) => _0x428af5['assetsByKind'][_0x523768] || [],
    )
      ['map']((_0x33ff21) => {
        const _0x1aa2ee = normalizeStringArray(_0x33ff21?.['sourceSceneRefs']),
          _0x32e1f8 = _0x1aa2ee['length']
            ? _0x1aa2ee
            : inferStoryAssetSourceSceneRefs(_0x33ff21?.['kind'], _0x33ff21?.['name'], _0x2d54f3);
        return { ..._0x33ff21, sourceSceneRefs: _0x32e1f8 };
      })
      ['filter'](
        (_0x2f9e1f) =>
          normalizeStringArray(_0x2f9e1f?.['sourceSceneRefs'])['length'] > 0x0 &&
          !(
            _0x2f9e1f?.['kind'] === 'prop' &&
            _0x13bcaa['some']((_0x32657e) => storyCharacterNamesOverlap(_0x2f9e1f?.['name'], _0x32657e))
          ),
      ),
    _0x46686b = reconcileStoryAssetInventory(
      parseStoryAssetInventoryResult(
        {
          assets: _0x111ffe['map']((_0x46536f) => ({
            ref: _0x46536f['ref'],
            kind: _0x46536f['kind'],
            name: _0x46536f['name'],
            role: _0x46536f['role'],
            description: _0x46536f['description'],
            sourceSceneRefs: _0x46536f['sourceSceneRefs'],
            appearances: (_0x46536f['appearances'] || [])['map']((_0x313343) => ({
              ref: _0x313343['ref'],
              name: _0x313343['name'],
              description: _0x313343['description'],
              sourceSceneRefs: _0x313343['sourceSceneRefs'],
            })),
          })),
          sceneAudits: _0x2d54f3['map']((_0x29a216) => ({
            sourceSceneRef: _0x29a216['ref'],
            keyPropNames: _0x111ffe['filter'](
              (_0x665eb7) =>
                _0x665eb7['kind'] === 'prop' && _0x665eb7['sourceSceneRefs']['includes'](_0x29a216['ref']),
            )['map']((_0x9da31e) => _0x9da31e['name']),
          })),
        },
        { sourceScenes: _0x2d54f3 },
      ),
      { project: project, sourceScenes: _0x2d54f3 },
    ),
    _0x37a76f = inspectStoryAssetInventoryCoverage(_0x46686b, _0x2d54f3);
  if (_0x37a76f['length']) throw createCoverageError(_0x37a76f);
  return (
    (_0x428af5['inventory'] = _0x46686b),
    (_0x428af5['completedAssets'] = finalizeStoryAssetInventoryAssets({
      inventory: _0x46686b,
      sourceScenes: _0x2d54f3,
      chapterIds: _0x2206f1['chapterIds'],
      visualStyle: _0x3ac7d3,
    })),
    (_0x428af5['status'] = 'completed'),
    (_0x428af5['failures'] = []),
    await _0x3690db(
      '资产提取完成：' +
        _0x428af5['completedAssets']['length'] +
        '\x20个资产；模型只返回精简清单，基础提示词已在本地生成',
    ),
    {
      schemaVersion: STORY_ASSET_EXTRACTION_SCHEMA_VERSION,
      extractionStrategy: 'kind-compact',
      assets: _0x428af5['completedAssets'],
    }
  );
}
