import {
  isStoryContinuousTimelinePromptMode,
  isStoryMinimaxH3PromptMode,
  isStorySeedance25PromptMode,
  isStoryWan30PromptMode,
  normalizeStoryPromptMode,
} from './storyPromptModes.js';
import { buildStoryMinimaxH3Prompt } from './storyMinimaxH3Prompt.js';
import { buildStoryReplicationTimelinePrompt } from './storyReplicationTimelinePrompt.js';
import { completeReplicationScenePropUsages } from './storyReplicationDefinitions.js';
import { replicationVisualFields } from '../../domain/storyGeneration/videoReplicationVisualState.js';
import { formatStoryPromptShotHeading } from '../../domain/storyGeneration/promptShotFormat.js';
import { getStorySpatialContinuityPromptLines } from '../../domain/storyGeneration/promptModeRules.js';
import { syncStoryClipPromptReferences } from './storyClipPromptReferences.js';
import { syncStoryReplicationPromptReferences } from './storyReplicationPromptReferences.js';
import { sanitizeStoryAssetPublicPromptText } from '../../../api/utils/storyAssetPublicText.js';
const MEDIA_FIELDS = Object['freeze']([
  'baseAppearanceId',
  'voiceReference',
  'voiceReferenceHistory',
  'imageUrl',
  'generatedImage',
  'videoUrl',
  'resultUrl',
  'taskId',
  'task',
  'result',
  'outputs',
  'video',
  'generation',
  'inputs',
  'videoGenerationDurationSec',
  'canvasBinding',
  'canvasId',
]);
export const STORY_CHARACTER_ASSET_PROMPT_PREFIX = '生成水平正视全身立绘，纯灰色背景';
function normalizeText(value) {
  return String(value || '')['trim']();
}
function stripStoryCharacterAssetPromptPrefix(item = '') {
  const text = normalizeText(item);
  if (!text['startsWith'](STORY_CHARACTER_ASSET_PROMPT_PREFIX)) return text;
  return text['slice'](STORY_CHARACTER_ASSET_PROMPT_PREFIX['length'])
    ['replace'](/^[\s,，。；;:：|/-]+/u, '')
    ['trim']();
}
function ensureStoryCharacterAssetPromptPrefix(key = '') {
  const stripStoryCharacterAssetPromptPrefix2 = stripStoryCharacterAssetPromptPrefix(key);
  return stripStoryCharacterAssetPromptPrefix2
    ? STORY_CHARACTER_ASSET_PROMPT_PREFIX + '\n' + stripStoryCharacterAssetPromptPrefix2
    : '';
}
function applyStoryCharacterAssetPromptPrefix(args = {}) {
  if (args?.['kind'] !== 'character') return args;
  const index = Array['isArray'](args['appearances'])
    ? args['appearances']['map']((args2) => ({
        ...args2,
        prompt: ensureStoryCharacterAssetPromptPrefix(args2?.['prompt']),
      }))
    : [];
  return {
    ...args,
    appearances: index,
    prompt: index[0]?.['prompt'] || ensureStoryCharacterAssetPromptPrefix(args?.['prompt']),
  };
}
function removeStoryCharacterAssetPromptPrefix(args3 = {}) {
  if (args3?.['kind'] !== 'character') return args3;
  return {
    ...args3,
    prompt: stripStoryCharacterAssetPromptPrefix(args3?.['prompt']),
    appearances: Array['isArray'](args3['appearances'])
      ? args3['appearances']['map']((args4) => ({
          ...args4,
          prompt: stripStoryCharacterAssetPromptPrefix(args4?.['prompt']),
        }))
      : args3['appearances'],
  };
}
export function normalizeStoryAssetDisplayName(result, data, options) {
  const target =
      data === 'scene'
        ? '场景 ' + (options + 1)
        : data === 'prop'
          ? '道具 ' + (options + 1)
          : '角色 ' + (options + 1),
    text2 = normalizeText(result)
      ['replace'](/^(?:角色名|人物名|姓名|名称)\s*[:：]\s*/u, '')
      ['replace'](/^[“”"'‘’]+|[“”"'‘’]+$/gu, ''),
    args5 = text2['split'](/[，,。；;\n]/u)[0]?.['trim']() || '';
  if (!args5) return target;
  const source = data === 'character' ? 12 : 20;
  return [...args5]['slice'](0, source)['join']('');
}
export function normalizeStoryCharacterRole(next, current = '') {
  const text3 = normalizeText(next),
    text4 = normalizeText(current);
  if (/反派|敌对|反面人物|幕后黑手|宿敌|仇敌|反派首领/u['test'](text3)) return '反派';
  if (/主角|男主|女主|主人公/u['test'](text3)) return '主角';
  if (/^(?:路人|群众|群演|背景人物|无名角色)(?:$|[甲乙丙丁\d\s，,：:])/u['test'](text3)) return '路人';
  if (
    /^(?:路人|群众|群演|背景人物|无名角色)(?:$|[甲乙丙丁\d\s])/u['test'](text4) ||
    /^(?:追兵|守卫|弟子)[甲乙丙丁\d]+$/u['test'](text4)
  )
    return '路人';
  if (/反派|敌对|反面人物|幕后黑手|宿敌|仇敌/u['test'](text4)) return '反派';
  return '配角';
}
export function ensureStoryVisualStylePrefix(entry, record = '') {
  const text5 = normalizeText(entry),
    text6 = normalizeText(record);
  if (!text6) return text5;
  if (!text5 || text5['startsWith'](text6)) return text5 || text6;
  return text6 + '\n' + text5;
}
function replaceStoryVisualStylePrefix(
  payload,
  { previousStyle: previousStyle = '', visualStyle: visualStyle = '' } = {},
) {
  const text7 = normalizeText(previousStyle);
  let list = normalizeText(payload);
  return (
    text7 &&
      list['startsWith'](text7) &&
      (list = list['slice'](text7['length'])
        ['replace'](/^[\s,，。；;:：|/-]+/, '')
        ['trim']()),
    ensureStoryVisualStylePrefix(list, visualStyle)
  );
}
function normalizeTextArray(handle) {
  return Array['isArray'](handle) ? [...new Set(handle['map'](normalizeText)['filter'](Boolean))] : [];
}
function normalizePositiveNumber(state) {
  const count = Number(state);
  return Number['isFinite'](count) && count > 0 ? count : 0;
}
export function normalizeDurationSeconds(config) {
  const positiveNumber = normalizePositiveNumber(config);
  if (positiveNumber) return positiveNumber;
  const count2 = Number['parseFloat'](normalizeText(config));
  return Number['isFinite'](count2) && count2 > 0 ? count2 : 0;
}
function stableHash(scope) {
  const list2 = String(scope || '');
  let input = 0x811c9dc5;
  for (let output = 0; output < list2['length']; output += 1) {
    ((input ^= list2['charCodeAt'](output)), (input = Math['imul'](input, 0x1000193)));
  }
  return (input >>> 0)['toString'](36);
}
function normalizeIdPart(value2) {
  return normalizeText(value2)
    ['toLowerCase']()
    ['replace'](/[^a-z0-9]+/g, '-')
    ['replace'](/^-+|-+$/g, '')
    ['slice'](0, 40);
}
export function createStableStoryPlanningId(value3, ...args6) {
  const idPart = normalizeIdPart(value3) || 'story',
    value4 = args6['map'](normalizeText)['filter'](Boolean)['join']('|') || idPart,
    idPart2 = normalizeIdPart(args6['find']((value5) => normalizeIdPart(value5)) || '');
  return [idPart, idPart2, stableHash(value4)]['filter'](Boolean)['join']('-');
}
export function formatStoryClockDuration(value6) {
  const value7 = Math['max'](0, Math['round'](Number(value6) || 0)),
    count3 = Math['floor'](value7 / 3600),
    value8 = Math['floor']((value7 % 3600) / 60),
    value9 = value7 % 60,
    value10 = String(value8)['padStart'](2, '0'),
    value11 = String(value9)['padStart'](2, '0');
  return count3 > 0
    ? String(count3)['padStart'](2, '0') + ':' + value10 + ':' + value11
    : value10 + ':' + value11;
}
export function formatStoryClipDuration(value12) {
  const value13 = Math['max'](0, Number(value12) || 0);
  return value13['toFixed'](1) + 's';
}
function formatGeneratedStoryClipTitle(value14 = 0) {
  return '片段' + String(value14 + 1)['padStart'](2, '0');
}
function normalizeStoryAssetUsages(value15, value16 = []) {
  const list3 = Array['isArray'](value15)
      ? value15
      : normalizeTextArray(value16)['map']((value17) => ({ assetRef: value17 })),
    map = new Set(),
    value18 = [];
  return (
    list3['forEach']((enabled) => {
      if (!enabled || typeof enabled !== 'object' || Array['isArray'](enabled)) return;
      const text8 = normalizeText(enabled['assetRef']),
        text9 = normalizeText(enabled['appearanceRef']);
      if (!text8) return;
      const value19 = text8 + '\x00' + text9;
      if (map['has'](value19)) return;
      (map['add'](value19), value18['push']({ assetRef: text8, appearanceRef: text9 }));
    }),
    value18
  );
}
function deriveStoryAssetRefs(list4 = []) {
  return normalizeTextArray(list4['map']((value20) => value20?.['assetRef']));
}
function normalizeStoryEpisodeShot(options2 = {}) {
  const storyAssetUsages = normalizeStoryAssetUsages(options2?.['assetUsages'], options2?.['assetRefs']);
  return {
    durationSec: normalizeDurationSeconds(options2?.['durationSec'] || options2?.['durationSeconds']),
    ...replicationVisualFields(options2),
    ...(Object['prototype']['hasOwnProperty']['call'](options2, 'startSec')
      ? { startSec: Number(options2['startSec']) }
      : {}),
    ...(Object['prototype']['hasOwnProperty']['call'](options2, 'endSec')
      ? { endSec: Number(options2['endSec']) }
      : {}),
    time: normalizeText(options2?.['time']),
    assetUsages: storyAssetUsages,
    assetRefs: deriveStoryAssetRefs(storyAssetUsages),
    visual: normalizeText(options2?.['visual']),
    camera: normalizeText(options2?.['camera']),
    transitionFromPrevious: normalizeText(options2?.['transitionFromPrevious']),
    dialogue: normalizeText(options2?.['dialogue']),
    voiceover: normalizeText(options2?.['voiceover']),
    audio: normalizeText(options2?.['audio']),
  };
}
function normalizeStoryMinimaxH3ClipShots(list5 = [], value21 = '') {
  if (!isStoryMinimaxH3PromptMode(value21) || !list5['length']) return list5;
  const count4 = Number(
    list5['reduce']((value22, value23) => value22 + value23['durationSec'], 0)['toFixed'](3),
  );
  if (count4 <= 0 || count4 > 15 || (Number['isInteger'](count4) && count4 >= 4)) return list5;
  const count5 = Math['max'](4, Math['ceil'](count4));
  if (count5 > 15) return list5;
  const value24 = list5['length'] - 1,
    value25 = list5['slice'](0, value24)['reduce'](
      (value26, value27) => value26 + value27['durationSec'],
      0,
    );
  return list5['map']((args7, value28) =>
    value28 === value24 ? { ...args7, durationSec: Number((count5 - value25)['toFixed'](3)) } : args7,
  );
}
function ensurePromptSentence(value29) {
  const text10 = normalizeText(value29);
  if (!text10 || /[。！？!?；;：:]$/u['test'](text10)) return text10;
  return text10 + '。';
}
function addStrictLookupEntry(value30, value31, value32) {
  const text11 = normalizeText(value31);
  if (!text11) return;
  if (value30['has'](text11) && value30['get'](text11) !== value32) {
    value30['set'](text11, null);
    return;
  }
  value30['set'](text11, value32);
}
function buildStoryAssetUsageLookup(list6 = []) {
  const value33 = new Map();
  return (
    (Array['isArray'](list6) ? list6 : [])['forEach']((value34) => {
      (addStrictLookupEntry(value33, getPlanningRef(value34), value34),
        addStrictLookupEntry(value33, value34?.['id'], value34));
    }),
    value33
  );
}
function resolveStoryAssetUsage(value35, value36) {
  const text12 = normalizeText(value35?.['assetRef']),
    text13 = normalizeText(value35?.['appearanceRef']),
    enabled2 = value36['get'](text12) || null;
  if (!enabled2) return { assetRef: text12, appearanceRef: text13, asset: null, appearance: null };
  const list7 = Array['isArray'](enabled2?.['appearances']) ? enabled2['appearances'] : [],
    value37 = new Map();
  list7['forEach']((value38) => {
    (addStrictLookupEntry(value37, getPlanningRef(value38), value38),
      addStrictLookupEntry(value37, value38?.['id'], value38));
  });
  const value39 = text13 || normalizeText(enabled2?.['baseAppearanceId']),
    value40 = value39 ? value37['get'](value39) || null : list7[0] || null;
  return { assetRef: text12, appearanceRef: value39, asset: enabled2, appearance: value40 };
}
function buildStoryShotAssetReferenceText(
  list8 = [],
  value41 = [],
  { kinds: kinds = ['scene', 'character', 'prop', 'unknown'], mentionKinds: mentionKinds = kinds } = {},
) {
  const storyAssetUsageLookup = buildStoryAssetUsageLookup(value41),
    enabled3 = new Set(kinds),
    enabled4 = new Set(mentionKinds),
    enabled5 = { scene: [], character: [], prop: [], unknown: [] },
    enabled6 = [];
  return (
    normalizeStoryAssetUsages(list8)['forEach']((value42) => {
      const {
        assetRef: assetRef,
        appearanceRef: appearanceRef,
        asset: asset,
        appearance: appearance,
      } = resolveStoryAssetUsage(value42, storyAssetUsageLookup);
      if (!asset) {
        enabled3['has']('unknown') &&
          assetRef &&
          !enabled5['unknown']['includes'](assetRef) &&
          enabled5['unknown']['push'](assetRef);
        return;
      }
      const text14 = normalizeText(asset?.['name']) || assetRef,
        value43 = ['scene', 'character', 'prop']['includes'](asset?.['kind']) ? asset['kind'] : 'unknown';
      if (!enabled3['has'](value43)) return;
      if (appearanceRef && !appearance) {
        const value44 = text14 + ' · ' + appearanceRef;
        if (!enabled6['includes'](value44)) enabled6['push'](value44);
        return;
      }
      if (!enabled4['has'](value43)) return;
      const text15 = normalizeText(appearance?.['name']),
        value45 = '@' + text14 + (text15 ? ' · ' + text15 : '');
      if (!enabled5[value43]['includes'](value45)) enabled5[value43]['push'](value45);
    }),
    [
      enabled5['scene']['length'] ? '场景图片：' + enabled5['scene']['join']('、') : '',
      enabled5['character']['length'] ? '人物形象：' + enabled5['character']['join']('、') : '',
      enabled5['prop']['length'] ? '道具参考：' + enabled5['prop']['join']('、') : '',
      enabled6['length'] ? '未解析形象：' + enabled6['join']('、') : '',
      enabled5['unknown']['length'] ? '未解析素材：' + enabled5['unknown']['join']('、') : '',
    ]
      ['filter'](Boolean)
      ['map'](ensurePromptSentence)
      ['join'](' ')
  );
}
const STORY_SUBJECT_FEATURE_NOISE_PATTERN =
    /(?:角色设定|人物设定|设定图|全身立绘|半身立绘|角色立绘|纯色背景|灰色背景|白色背景|画幅|镜头|构图|景深|光线|光影|色调|风格|写实|电影|高清|画质|分辨率|4k|8k|16\s*[:：]\s*9|9\s*[:：]\s*16|24fps|单人角色|独立人物|正视立绘|侧视立绘|标准站姿)/iu,
  STORY_SCENE_TIME_PATTERN =
    /(?:深夜|夜晚|夜间|午夜|清晨|黎明|早晨|上午|中午|午后|下午|黄昏|傍晚|日间|白日|白天)/u;
function stripStoryPromptPrefix(value46 = '', value47 = '') {
  const text16 = normalizeText(value46),
    text17 = normalizeText(value47);
  if (!text17 || !text16['startsWith'](text17)) return text16;
  return text16['slice'](text17['length'])
    ['replace'](/^[\s,，。；;:：|/-]+/u, '')
    ['trim']();
}
function getStoryCharacterSubjectFeatures(value48, value49, value50 = '') {
  if (value49?.['sourceOrigin'] === 'library' && value49?.['imageUrl']) return [];
  const value51 = [
    value49?.['prompt'],
    value49?.['description'],
    value48?.['prompt'],
    value48?.['description'],
  ];
  for (const value52 of value51) {
    const stripStoryPromptPrefix2 = stripStoryPromptPrefix(
        stripStoryCharacterAssetPromptPrefix(sanitizeStoryAssetPublicPromptText(value52)),
        value50,
      ),
      value53 = [
        ...new Set(
          stripStoryPromptPrefix2['split'](/[，,。；;\n]+/u)
            ['map'](normalizeText)
            ['filter']((value54) => value54 && !STORY_SUBJECT_FEATURE_NOISE_PATTERN['test'](value54)),
        ),
      ]['slice'](0, 3);
    if (value53['length']) return value53;
  }
  return [];
}
function buildStoryClipCharacterSubjectDefinitions(list9 = [], value55 = [], value56 = '') {
  const storyAssetUsageLookup2 = buildStoryAssetUsageLookup(value55),
    value57 = new Set(),
    args8 = [],
    value58 = [];
  return (
    normalizeStoryAssetUsages(
      (Array['isArray'](list9) ? list9 : [])['flatMap']((value59) => value59?.['assetUsages'] || []),
    )['forEach']((value60) => {
      const {
        assetRef: assetRef2,
        appearanceRef: appearanceRef2,
        asset: asset2,
        appearance: appearance2,
      } = resolveStoryAssetUsage(value60, storyAssetUsageLookup2);
      if (asset2?.['kind'] !== 'character') return;
      if (value57['has'](assetRef2)) return;
      value57['add'](assetRef2);
      const text18 = normalizeText(asset2?.['name']) || assetRef2;
      if (!text18) return;
      if (appearanceRef2 && !appearance2) {
        value58['push'](text18 + ' · ' + appearanceRef2);
        return;
      }
      const text19 = normalizeText(appearance2?.['name']),
        value61 = '@' + text18 + (text19 ? ' · ' + text19 : ''),
        list10 = getStoryCharacterSubjectFeatures(asset2, appearance2, value56);
      args8['push'](
        list10['length']
          ? '将<' + value61 + '>中的' + list10['join']('、') + '定义为<' + text18 + '>。'
          : '将<' + value61 + '>定义为<' + text18 + '>。',
      );
    }),
    [...args8, value58['length'] ? '未解析形象：' + value58['join']('、') + '。' : '']
      ['filter'](Boolean)
      ['join']('\n')
  );
}
function extractStorySceneTimeLabel(value62 = '') {
  return normalizeText(value62)['match'](STORY_SCENE_TIME_PATTERN)?.[0] || '';
}
function resolveStoryClipSceneTimeLabel(list11 = [], value63 = []) {
  const storyAssetUsageLookup3 = buildStoryAssetUsageLookup(value63),
    storyAssetUsages2 = normalizeStoryAssetUsages(
      (Array['isArray'](list11) ? list11 : [])['flatMap']((value64) => value64?.['assetUsages'] || []),
    );
  for (const value65 of storyAssetUsages2) {
    const { asset: asset3, appearance: appearance3 } = resolveStoryAssetUsage(
      value65,
      storyAssetUsageLookup3,
    );
    if (asset3?.['kind'] !== 'scene') continue;
    const value66 = [
      appearance3?.['name'],
      appearance3?.['description'],
      appearance3?.['prompt'],
      asset3?.['name'],
      asset3?.['description'],
      asset3?.['prompt'],
    ];
    for (const value67 of value66) {
      const extractStorySceneTimeLabel2 = extractStorySceneTimeLabel(value67);
      if (extractStorySceneTimeLabel2) return extractStorySceneTimeLabel2;
    }
  }
  return '';
}
function stripStoryDialogueOuterQuotes(value68 = '') {
  let list12 = normalizeText(value68);
  const value69 = [
    ['“', '”'],
    ['"', '"'],
  ];
  return (
    value69['forEach'](([value70, value71]) => {
      list12['startsWith'](value70) &&
        list12['endsWith'](value71) &&
        (list12 = list12['slice'](value70['length'], -value71['length'])['trim']());
    }),
    list12
  );
}
const STORY_DIALOGUE_SPEAKER_PATTERN =
  /(^|[\n。！？!?；;][”"]?)\s*([^：:\n。！？!?；;“”"()（）]{1,80}(?:[（(][^）)\n]*[)）])?)[：:]\s*/gu;
function getStoryDialogueSpeakerLabels(value72 = '') {
  const args9 = normalizeText(value72);
  if (!args9) return [];
  const enabled7 = [...args9['matchAll'](STORY_DIALOGUE_SPEAKER_PATTERN)];
  if (!enabled7['length'] || normalizeText(args9['slice'](0, enabled7[0]['index']))) return [];
  return enabled7['map']((value73) => normalizeText(value73[2]))['filter'](Boolean);
}
function resolveStoryDialogueSpeakerCandidate(value74 = '', value75 = [], value76 = []) {
  const list13 = normalizeText(value74);
  if (!list13) return null;
  const storyAssetUsageLookup4 = buildStoryAssetUsageLookup(value76),
    list14 = normalizeStoryAssetUsages(value75)
      ['map']((value77) => {
        const args10 = resolveStoryAssetUsage(value77, storyAssetUsageLookup4),
          text20 = normalizeText(args10['asset']?.['name']);
        if (args10['asset']?.['kind'] !== 'character' || !text20) return null;
        let value78 = 0,
          value79 = '';
        if (list13 === text20) value78 = 3;
        else {
          if (list13['startsWith'](text20)) ((value78 = 2), (value79 = list13['slice'](text20['length'])));
          else list13['length'] >= 2 && text20['endsWith'](list13) && (value78 = 1);
        }
        return value78 ? { ...args10, assetName: text20, score: value78, suffix: value79 } : null;
      })
      ['filter'](Boolean)
      ['sort']((value80, value81) => value81['score'] - value80['score']);
  if (!list14['length'] || (list14[1] && list14[1]['score'] === list14[0]['score'])) return null;
  return list14[0];
}
function resolveStoryDialogueSpeakerMention(value82 = '', value83 = [], value84 = []) {
  const text21 = normalizeText(value82);
  if (!text21) return '';
  const storyDialogueSpeakerCandidate = resolveStoryDialogueSpeakerCandidate(text21, value83, value84);
  if (!storyDialogueSpeakerCandidate) return text21;
  const text22 = normalizeText(storyDialogueSpeakerCandidate['appearance']?.['name']),
    value85 = '@' + storyDialogueSpeakerCandidate['assetName'] + (text22 ? ' · ' + text22 : ''),
    value86 = storyDialogueSpeakerCandidate['suffix']['trim']()['replace'](/^[(（]\s*|\s*[)）]$/gu, '');
  return '' + value85 + (value86 ? '（' + value86 + '）' : '');
}
function formatStoryClipDialogue(value87 = '', { assetUsages: assetUsages = [], assets: assets = [] } = {}) {
  const list15 = normalizeText(value87);
  if (!list15) return '';
  const enabled8 = [...list15['matchAll'](STORY_DIALOGUE_SPEAKER_PATTERN)];
  if (!enabled8['length'] || normalizeText(list15['slice'](0, enabled8[0]['index'])))
    return '“' + stripStoryDialogueOuterQuotes(list15) + '”';
  return enabled8['map']((value88, value89) => {
    const value90 = enabled8[value89 + 1],
      value91 = Number(value88['index'] || 0) + value88[0]['length'],
      value92 = value90
        ? Number(value90['index'] || 0) + String(value90[1] || '')['length']
        : list15['length'],
      storyDialogueSpeakerMention = resolveStoryDialogueSpeakerMention(value88[2], assetUsages, assets),
      stripStoryDialogueOuterQuotes2 = stripStoryDialogueOuterQuotes(list15['slice'](value91, value92));
    return storyDialogueSpeakerMention + '：“' + stripStoryDialogueOuterQuotes2 + '”';
  })
    ['filter'](Boolean)
    ['join']('\n');
}
export function getStoryClipDialogueSpeakerAssetIds(options3 = {}, value93 = []) {
  const value94 = [],
    value95 = new Set(),
    value96 = Array['isArray'](options3?.['shots'])
      ? options3['shots']['map'](normalizeStoryEpisodeShot)
      : [];
  return (
    value96['forEach']((value97) => {
      getStoryDialogueSpeakerLabels(value97['dialogue'])['forEach']((value98) => {
        const storyDialogueSpeakerCandidate2 = resolveStoryDialogueSpeakerCandidate(
            value98,
            value97['assetUsages'],
            value93,
          ),
          text23 = normalizeText(storyDialogueSpeakerCandidate2?.['asset']?.['id']);
        if (!text23 || value95['has'](text23)) return;
        (value95['add'](text23), value94['push'](text23));
      });
    }),
    value94
  );
}
function normalizeStoryDialogueVoiceDescription(value99 = '') {
  return [...normalizeText(value99)['replace'](/\s+/gu, ' ')]['slice'](0, 600)['join']('');
}
function buildStoryClipDialogueVoiceGuidanceLines(options4 = {}, value100 = []) {
  const list16 = [],
    value101 = new Set();
  getStoryDialogueSpeakerLabels(options4['dialogue'])['forEach']((value102) => {
    const storyDialogueSpeakerCandidate3 = resolveStoryDialogueSpeakerCandidate(
        value102,
        options4['assetUsages'],
        value100,
      ),
      text24 = normalizeText(storyDialogueSpeakerCandidate3?.['assetName']) || value102,
      text25 = normalizeText(storyDialogueSpeakerCandidate3?.['asset']?.['id']) || text24;
    if (!text24 || value101['has'](text25)) return;
    (value101['add'](text25),
      list16['push']({ name: text24, asset: storyDialogueSpeakerCandidate3?.['asset'] || null }));
  });
  if (!list16['length']) return [];
  const storyAssetUsageLookup5 = buildStoryAssetUsageLookup(value100),
    value103 = [],
    value104 = new Set();
  normalizeStoryAssetUsages(options4['assetUsages'])['forEach']((value105) => {
    const { asset: asset4 } = resolveStoryAssetUsage(value105, storyAssetUsageLookup5),
      text26 = normalizeText(asset4?.['id']),
      text27 = normalizeText(asset4?.['name']),
      value106 = text26 || text27;
    if (asset4?.['kind'] !== 'character' || !text27 || value104['has'](value106)) return;
    (value104['add'](value106), value103['push']({ key: value106, name: text27 }));
  });
  const enabled9 = new Set(
      list16['map'](({ asset: asset5, name: name }) => normalizeText(asset5?.['id']) || name),
    ),
    value107 = value103['filter'](({ key: key2 }) => !enabled9['has'](key2))['map'](
      ({ name: name2 }) => name2,
    ),
    args11 = list16['flatMap'](({ name: name3, asset: asset6 }) => {
      const storyDialogueVoiceDescription = normalizeStoryDialogueVoiceDescription(
        asset6?.['voiceDescription'],
      );
      return storyDialogueVoiceDescription
        ? ['声音设定（' + name3 + '）：' + ensurePromptSentence(storyDialogueVoiceDescription)]
        : [];
    }),
    value108 =
      list16['length'] === 1
        ? '发声与口型约束：本分镜仅' +
          list16[0]['name'] +
          '发声并同步口型；' +
          (value107['length'] ? value107['join']('、') + '及' : '') +
          '其他画面角色保持静默，不张嘴、不做说话口型。'
        : '发声与口型约束：本分镜对白按标注顺序轮流发声；每句仅当前标注的说话人发声并同步口型；其余角色保持静默，不张嘴、不做说话口型。';
  return [...args11, value108];
}
function buildStoryClipDialoguePromptBlock(
  value109 = '',
  {
    assetUsages: assetUsages = [],
    assets: assets = [],
    includeDialogueVoiceGuidance: includeDialogueVoiceGuidance = ![],
  } = {},
) {
  const formatStoryClipDialogue2 = formatStoryClipDialogue(value109, {
    assetUsages: assetUsages,
    assets: assets,
  });
  if (!formatStoryClipDialogue2) return '';
  const list17 = [];
  return (
    includeDialogueVoiceGuidance &&
      list17['push'](
        ...buildStoryClipDialogueVoiceGuidanceLines({ dialogue: value109, assetUsages: assetUsages }, assets),
      ),
    list17['push'](formatStoryClipDialogue2),
    list17['join']('\n')
  );
}
function removeStoryClipDialoguePrefix(value110 = '') {
  return String(value110)['replace'](/(^|\n|<div>|<p>|<br\s*\/?>)[ \t]*对白：[ \t]*/gu, '$1');
}
export function applyStoryClipDialogueVoiceGuidance(value111 = '', value112 = {}, value113 = []) {
  if (value112['promptLanguage']) return String(value111 || '');
  const removeStoryClipDialoguePrefix2 = removeStoryClipDialoguePrefix(value111 || '');
  if (!removeStoryClipDialoguePrefix2 || !Array['isArray'](value112?.['shots']))
    return removeStoryClipDialoguePrefix2;
  const value114 = removeStoryClipDialoguePrefix2['split']('\n')
      ['filter']((value115) => !/^(?:声音设定（.+?）|发声与口型约束)：/u['test'](value115['trim']()))
      ['join']('\n'),
    value116 = value112['shots']['map'](normalizeStoryEpisodeShot)['flatMap']((value117) => {
      if (!normalizeText(value117['dialogue'])) return [];
      const storyClipDialogueVoiceGuidanceLines = buildStoryClipDialogueVoiceGuidanceLines(
        value117,
        value113,
      );
      return storyClipDialogueVoiceGuidanceLines['length'] ? [storyClipDialogueVoiceGuidanceLines] : [];
    }),
    value118 = value114['split']('\n'),
    enabled10 = value118['map']((value119) => {
      const value120 = value119['replace'](/<[^>]+>/gu, '')['trim']();
      return (
        !/^(?:画外音|音效)：/u['test'](value120) &&
        /^(?:[^：:\n“”"()（）]+(?:[（(][^）)\n]*[)）])?[：:]\s*)?[“"]/u['test'](value120)
      );
    }),
    enabled11 = enabled10['map']((value121, value122) => value121 && !enabled10[value122 - 1]);
  if (enabled11['filter'](Boolean)['length'] !== value116['length']) return removeStoryClipDialoguePrefix2;
  let value123 = 0;
  return value118['flatMap']((value124, value125) => {
    if (!enabled11[value125]) return [value124];
    const args12 = value116[value123];
    return ((value123 += 1), [...args12, value124]);
  })['join']('\n');
}
export function syncStoryEpisodeClipDialogueMentions(
  args13 = {},
  value126 = [],
  { includeDialogueVoiceGuidance: includeDialogueVoiceGuidance = ![], sourceMode: sourceMode = '' } = {},
) {
  if (args13['promptLanguage']) return args13;
  const enabled12 = String(args13?.['prompt'] || '');
  if (!enabled12 || !Array['isArray'](args13?.['shots'])) return args13;
  let removeStoryClipDialoguePrefix3 = removeStoryClipDialoguePrefix(enabled12);
  const value127 = args13['shots']['map'](normalizeStoryEpisodeShot);
  value127['forEach']((value128) => {
    const text28 = normalizeText(value128['dialogue']);
    if (!text28) return;
    const formatStoryClipDialogue3 = formatStoryClipDialogue(text28),
      formatStoryClipDialogue4 = formatStoryClipDialogue(text28, {
        assetUsages: value128['assetUsages'],
        assets: value126,
      });
    if (!formatStoryClipDialogue3) return;
    const value129 = formatStoryClipDialogue3,
      value130 = formatStoryClipDialogue4;
    if (removeStoryClipDialoguePrefix3['includes'](value130)) return;
    else
      removeStoryClipDialoguePrefix3['includes'](value129) &&
        (removeStoryClipDialoguePrefix3 = removeStoryClipDialoguePrefix3['replace'](value129, value130));
  });
  includeDialogueVoiceGuidance &&
    !(sourceMode === 'video-replication' && isStorySeedance25PromptMode(args13['promptMode'])) &&
    (removeStoryClipDialoguePrefix3 = applyStoryClipDialogueVoiceGuidance(
      removeStoryClipDialoguePrefix3,
      args13,
      value126,
    ));
  removeStoryClipDialoguePrefix3 = syncStoryClipPromptReferences(removeStoryClipDialoguePrefix3, value126);
  if (sourceMode === 'video-replication')
    removeStoryClipDialoguePrefix3 = syncStoryReplicationPromptReferences(
      removeStoryClipDialoguePrefix3,
      { ...args13, shots: value127 },
      value126,
    );
  return removeStoryClipDialoguePrefix3 === enabled12
    ? args13
    : { ...args13, prompt: removeStoryClipDialoguePrefix3 };
}
function buildStoryClipSceneSettingText(list18 = [], value131 = []) {
  const storyClipSceneTimeLabel = resolveStoryClipSceneTimeLabel(list18, value131),
    storyShotAssetReferenceText = buildStoryShotAssetReferenceText(
      list18['flatMap']((value132) => value132?.['assetUsages'] || []),
      value131,
      { kinds: ['scene'] },
    )['replace'](/^场景图片：/u, ''),
    value133 = [
      storyShotAssetReferenceText,
      storyClipSceneTimeLabel ? ensurePromptSentence('时间：' + storyClipSceneTimeLabel) : '',
    ]
      ['filter'](Boolean)
      ['join'](' ');
  return storyShotAssetReferenceText ? '本片段场景设定在：' + value133 : '';
}
function buildStoryClipPropSettingText(list19 = [], value134 = []) {
  const storyShotAssetReferenceText2 = buildStoryShotAssetReferenceText(
    list19['flatMap']((value135) => value135?.['assetUsages'] || []),
    value134,
    { kinds: ['prop', 'unknown'] },
  );
  return storyShotAssetReferenceText2 ? '本片段道具设定：' + storyShotAssetReferenceText2 : '';
}
function buildStoryClipSeedance25ReferenceBindings(list20 = [], value136 = []) {
  const storyAssetUsageLookup6 = buildStoryAssetUsageLookup(value136),
    list21 = [],
    list22 = [];
  return (
    normalizeStoryAssetUsages(
      (Array['isArray'](list20) ? list20 : [])['flatMap']((value137) => value137?.['assetUsages'] || []),
    )['forEach']((value138) => {
      const {
        assetRef: assetRef3,
        appearanceRef: appearanceRef3,
        asset: asset7,
        appearance: appearance4,
      } = resolveStoryAssetUsage(value138, storyAssetUsageLookup6);
      if (!asset7) {
        if (assetRef3) list22['push'](assetRef3);
        return;
      }
      const text29 = normalizeText(asset7?.['name']) || assetRef3;
      if (!text29) return;
      if (appearanceRef3 && !appearance4) {
        list22['push'](text29 + ' · ' + appearanceRef3);
        return;
      }
      const text30 = normalizeText(appearance4?.['name']),
        value139 = '@' + text29 + (text30 ? ' · ' + text30 : '');
      if (asset7?.['kind'] === 'character')
        list21['push'](
          value139 +
            '：定义为' +
            text29 +
            '，仅参考身份、五官、发型、体型与服装；不采用图中背景、表情、动作或构图。',
        );
      else {
        if (asset7?.['kind'] === 'scene')
          list21['push'](
            value139 +
              '：作为本片段场景，仅参考空间布局、材质、固定地标、出入口与光线；不采用图中人物或前景。',
          );
        else
          asset7?.['kind'] === 'prop' &&
            list21['push'](
              value139 + '：作为本片段道具，仅参考外观、结构、材质与开场状态；不采用图中背景或构图。',
            );
      }
    }),
    [
      list21['length'] ? '参考素材绑定：\n' + [...new Set(list21)]['join']('\n') : '',
      list22['length'] ? '未解析素材：' + [...new Set(list22)]['join']('、') + '。' : '',
    ]
      ['filter'](Boolean)
      ['join']('\n')
  );
}
function buildStoryClipWan30ReferenceBindings(list23 = [], value140 = []) {
  const storyAssetUsageLookup7 = buildStoryAssetUsageLookup(value140),
    list24 = [],
    list25 = [];
  return (
    normalizeStoryAssetUsages(
      (Array['isArray'](list23) ? list23 : [])['flatMap']((value141) => value141?.['assetUsages'] || []),
    )['forEach']((value142) => {
      const {
        assetRef: assetRef4,
        appearanceRef: appearanceRef4,
        asset: asset8,
        appearance: appearance5,
      } = resolveStoryAssetUsage(value142, storyAssetUsageLookup7);
      if (!asset8) {
        if (assetRef4) list25['push'](assetRef4);
        return;
      }
      const text31 = normalizeText(asset8?.['name']) || assetRef4;
      if (!text31) return;
      if (appearanceRef4 && !appearance5) {
        list25['push'](text31 + ' · ' + appearanceRef4);
        return;
      }
      const text32 = normalizeText(appearance5?.['name']),
        value143 = '@' + text31 + (text32 ? ' · ' + text32 : '');
      if (asset8?.['kind'] === 'character')
        list24['push'](
          value143 +
            '：定义为' +
            text31 +
            '，图像锁定身份、五官、发型、体型与服装；如包含声音素材，则作为' +
            text31 +
            '的声线与说话方式参考。',
        );
      else {
        if (asset8?.['kind'] === 'scene')
          list24['push'](value143 + '：定义为本片段场景，锁定空间布局、固定地标、出入口与光线方向。');
        else
          asset8?.['kind'] === 'prop' &&
            list24['push'](value143 + '：定义为' + text31 + '，锁定外观与开场状态。');
      }
    }),
    [
      list24['length'] ? '参考素材绑定：\n' + [...new Set(list24)]['join']('\n') : '',
      list25['length'] ? '未解析素材：' + [...new Set(list25)]['join']('、') + '。' : '',
    ]
      ['filter'](Boolean)
      ['join']('\n')
  );
}
function replaceStoryClipBoundMentionsWithNames(value144 = '', value145 = [], value146 = []) {
  let text33 = normalizeText(value144);
  if (!text33) return '';
  const storyAssetUsageLookup8 = buildStoryAssetUsageLookup(value146),
    list26 = normalizeStoryAssetUsages(value145)
      ['flatMap']((value147) => {
        const {
            assetRef: assetRef5,
            asset: asset9,
            appearance: appearance6,
          } = resolveStoryAssetUsage(value147, storyAssetUsageLookup8),
          text34 = normalizeText(asset9?.['name']) || assetRef5;
        if (!text34) return [];
        const text35 = normalizeText(appearance6?.['name']);
        return [text35 ? '@' + text34 + ' · ' + text35 : '', '@' + text34]
          ['filter'](Boolean)
          ['map']((value148) => ({ mention: value148, assetName: text34 }));
      })
      ['sort']((value149, value150) => value150['mention']['length'] - value149['mention']['length']);
  return (
    list26['forEach'](({ mention: mention, assetName: assetName }) => {
      text33 = text33['split'](mention)['join'](assetName);
    }),
    text33
  );
}
function formatStoryContinuousTimelineRange(
  options5 = {},
  value151 = 0,
  value152 = 0,
  value153 = '视频模型',
) {
  const value154 = Number(options5?.['startSec']),
    count6 = Number(options5?.['endSec']),
    value155 = Number(options5?.['durationSec']);
  if (
    !Number['isInteger'](value154) ||
    !Number['isInteger'](count6) ||
    value154 !== value152 ||
    count6 <= value154 ||
    count6 - value154 !== value155 ||
    count6 > 30
  )
    throw new Error(value153 + ' 的分镜 ' + (value151 + 1) + ' 缺少模型返回的连续整数时间区间。');
  return value154 + '-' + count6 + '秒';
}
function splitStoryClipOpeningPosition(value156 = '') {
  const list27 = normalizeText(value156);
  if (!list27['startsWith']('人物站位：')) return { position: '', visual: list27 };
  const count7 = list27['search'](/[。！？\n]/u);
  if (count7 < 0) return { position: list27, visual: list27 };
  const value157 = list27['slice'](0, count7 + 1)['trim'](),
    value158 = list27['slice'](count7 + 1)['trim']();
  return { position: value157, visual: value158 || list27 };
}
export function buildStoryEpisodeClipPrompt({
  clip: clip = {},
  assets: assets = [],
  visualStyle: visualStyle = '',
  promptMode: promptMode = clip?.['promptMode'],
  includeDialogueVoiceGuidance: includeDialogueVoiceGuidance = ![],
  sourceMode: sourceMode = '',
} = {}) {
  if (clip['promptLanguage'] && clip['prompt']) return String(clip['prompt']);
  const storyPromptMode = normalizeStoryPromptMode(promptMode, { allowDeveloperModes: !![] }),
    args14 = isStorySeedance25PromptMode(storyPromptMode),
    isStoryWan30PromptMode2 = isStoryWan30PromptMode(storyPromptMode),
    isStoryMinimaxH3PromptMode2 = isStoryMinimaxH3PromptMode(storyPromptMode),
    isStoryContinuousTimelinePromptMode2 = isStoryContinuousTimelinePromptMode(storyPromptMode),
    enabled13 = Array['isArray'](clip?.['shots'])
      ? clip['shots']['map'](normalizeStoryEpisodeShot)['filter']((value159) => value159['durationSec'] > 0)
      : [];
  if (!enabled13['length']) {
    const storyVisualStylePrefix = ensureStoryVisualStylePrefix(clip?.['prompt'], visualStyle);
    return sourceMode === 'video-replication'
      ? syncStoryReplicationPromptReferences(
          storyVisualStylePrefix,
          { ...clip, promptMode: storyPromptMode },
          assets,
        )
      : storyVisualStylePrefix;
  }
  const count8 = Number(
    enabled13['reduce']((value160, value161) => value160 + value161['durationSec'], 0)['toFixed'](3),
  );
  if (isStoryMinimaxH3PromptMode2 && (!Number['isInteger'](count8) || count8 < 4 || count8 > 15))
    throw new Error('MiniMax H3 的单个片段总时长必须是 4 至 15 秒的整数。');
  if (isStoryMinimaxH3PromptMode2) {
    const storyMinimaxH3Prompt = buildStoryMinimaxH3Prompt({ clip: clip, shots: enabled13, assets: assets });
    return sourceMode === 'video-replication'
      ? syncStoryReplicationPromptReferences(
          syncStoryClipPromptReferences(storyMinimaxH3Prompt, assets),
          { ...clip, shots: enabled13, promptMode: storyPromptMode },
          assets,
        )
      : storyMinimaxH3Prompt;
  }
  if (sourceMode === 'video-replication' && args14) {
    const storyReplicationTimelinePrompt = buildStoryReplicationTimelinePrompt({
      clip: { ...clip, promptMode: storyPromptMode },
      shots: completeReplicationScenePropUsages(enabled13, assets),
      assets: assets,
      visualStyle: visualStyle,
      referenceHeader: buildStoryClipSeedance25ReferenceBindings(enabled13, assets),
      continuityLines: [],
    });
    return storyReplicationTimelinePrompt;
  }
  const value162 = clip?.['directorContinuityTest'] === !![],
    value163 =
      clip?.['continuityHandoff'] && typeof clip['continuityHandoff'] === 'object'
        ? clip['continuityHandoff']
        : {},
    value164 = Boolean(normalizeText(value163['previousExitState'])),
    text36 =
      normalizeText(clip?.['creativeIntent']) === '准确呈现当前剧情动作与情绪变化。'
        ? ''
        : normalizeText(clip?.['creativeIntent']),
    text37 =
      normalizeText(clip?.['transition']) === '镜头按动作与视线连续衔接。'
        ? ''
        : normalizeText(clip?.['transition']),
    list28 = [
      normalizeText(visualStyle),
      isStoryContinuousTimelinePromptMode2
        ? isStoryWan30PromptMode2
          ? buildStoryClipWan30ReferenceBindings(enabled13, assets)
          : buildStoryClipSeedance25ReferenceBindings(enabled13, assets)
        : buildStoryClipCharacterSubjectDefinitions(enabled13, assets, visualStyle),
      isStoryContinuousTimelinePromptMode2 ? '' : buildStoryClipSceneSettingText(enabled13, assets),
      isStoryContinuousTimelinePromptMode2 ? '' : buildStoryClipPropSettingText(enabled13, assets),
      isStoryWan30PromptMode2
        ? '视频目标：生成 ' +
          (Number(enabled13['at'](-1)?.['endSec']) || 0) +
          ' 秒' +
          (enabled13['length'] === 1 ? '单镜头一镜到底' : '多镜头连续叙事') +
          '视频；严格按下方时间轴执行。'
        : '',
      ...(args14 || value162 ? getStorySpatialContinuityPromptLines() : []),
      value162
        ? '镜头执行：严格按每镜的衔接说明判断切镜或连续长镜；不要把所有分镜自动合并为一镜到底，也不要机械套用固定角度、固定正反打或固定镜头数量。'
        : '',
      value164
        ? [
            '连续场景技术切片：本段不是独立开场，必须从上一片段的结束状态直接续演；不得重置人物位置、朝向、动作进度、道具、车辆、设备或场景。',
            '上一片段结束状态为' + ensurePromptSentence(value163['previousExitState']),
            normalizeText(value163['currentEntryState'])
              ? '本段开场状态为' + ensurePromptSentence(value163['currentEntryState'])
              : '',
            value162 && normalizeText(value163['previousEndCamera'])
              ? '上一片段结束镜头为' + ensurePromptSentence(value163['previousEndCamera'])
              : '',
            value162
              ? '本段开场镜头为' +
                ensurePromptSentence(value163['currentOpeningCamera'] || enabled13[0]?.['camera'])
              : '',
            '只有当前分镜明确表现出移动、操作、状态变化、换场或时间跳跃时，才允许改变交接状态。',
          ]
            ['filter'](Boolean)
            ['join'](' ')
        : '',
      text36
        ? (isStoryContinuousTimelinePromptMode2 ? '核心故事' : '这一幕想要呈现的感觉') +
          '：' +
          ensurePromptSentence(text36)
        : '',
      text37 ? '分镜过渡：' + ensurePromptSentence(text37) : '',
    ]['filter'](Boolean),
    value165 = enabled13['flatMap']((value166) => value166['assetUsages'] || []);
  let value167 = 0;
  enabled13['forEach']((value168, count9) => {
    const replaceStoryClipBoundMentionsWithNames2 = replaceStoryClipBoundMentionsWithNames(
        value168['camera'],
        value165,
        assets,
      ),
      replaceStoryClipBoundMentionsWithNames3 = replaceStoryClipBoundMentionsWithNames(
        value168['visual'],
        value165,
        assets,
      ),
      value169 =
        count9 === 0 && !args14
          ? splitStoryClipOpeningPosition(replaceStoryClipBoundMentionsWithNames3)
          : { position: '', visual: replaceStoryClipBoundMentionsWithNames3 },
      value170 = value169['visual'],
      replaceStoryClipBoundMentionsWithNames4 = replaceStoryClipBoundMentionsWithNames(
        value168['dialogue'],
        value165,
        assets,
      ),
      replaceStoryClipBoundMentionsWithNames5 = replaceStoryClipBoundMentionsWithNames(
        value168['voiceover'],
        value165,
        assets,
      ),
      replaceStoryClipBoundMentionsWithNames6 = replaceStoryClipBoundMentionsWithNames(
        value168['audio'],
        value165,
        assets,
      ),
      text38 = normalizeText(value168['transitionFromPrevious']);
    if (value169['position']) list28['push'](value169['position']);
    const value171 = [
      replaceStoryClipBoundMentionsWithNames2
        ? ensurePromptSentence(replaceStoryClipBoundMentionsWithNames2)
        : '',
      value170 ? ensurePromptSentence(value170) : '',
    ]
      ['filter'](Boolean)
      ['join'](' ');
    value162 &&
      text38 &&
      list28['push']((count9 === 0 ? '开场衔接' : '镜头衔接') + '：' + ensurePromptSentence(text38));
    if (isStoryContinuousTimelinePromptMode2) {
      const formatStoryContinuousTimelineRange2 = formatStoryContinuousTimelineRange(
        value168,
        count9,
        value167,
        isStoryWan30PromptMode2 ? 'Wan 3.0' : 'Seedance 2.5',
      );
      ((value167 = Number(value168['endSec'])),
        list28['push'](
          formatStoryPromptShotHeading({
            promptMode: storyPromptMode,
            index: count9,
            timeRange: formatStoryContinuousTimelineRange2,
          }) +
            '：' +
            value171,
        ));
    } else
      list28['push'](
        formatStoryPromptShotHeading({
          promptMode: storyPromptMode,
          index: count9,
          durationSec: value168['durationSec'],
        }) +
          '：' +
          value171,
      );
    replaceStoryClipBoundMentionsWithNames4 &&
      list28['push'](
        buildStoryClipDialoguePromptBlock(replaceStoryClipBoundMentionsWithNames4, {
          assetUsages: value168['assetUsages'],
          assets: assets,
          includeDialogueVoiceGuidance: includeDialogueVoiceGuidance,
        }),
      );
    if (replaceStoryClipBoundMentionsWithNames5)
      list28['push']('画外音：' + ensurePromptSentence(replaceStoryClipBoundMentionsWithNames5));
    if (replaceStoryClipBoundMentionsWithNames6)
      list28['push']('音效：' + ensurePromptSentence(replaceStoryClipBoundMentionsWithNames6));
  });
  if (args14)
    list28['push'](
      '全局要求：角色、场景与道具严格沿用开头绑定；人物位置、朝向、持物和状态连续变化；对白口型与说话人一致，不新增人物、道具、字幕或水印。',
    );
  else
    isStoryWan30PromptMode2 &&
      list28['push'](
        '全局要求：角色、场景与道具严格沿用开头绑定；保持人物位置、朝向、持物、服装、情绪和场景方向连续；多人对白始终使用唯一角色名，不用他或她代替说话人；对白口型、动作与说话人一致；不新增人物、道具、对白、旁白、字幕、标识或水印。',
      );
  const syncStoryClipPromptReferences2 = syncStoryClipPromptReferences(list28['join']('\n'), assets);
  return sourceMode === 'video-replication'
    ? syncStoryReplicationPromptReferences(
        syncStoryClipPromptReferences2,
        { ...clip, shots: enabled13, promptMode: storyPromptMode },
        assets,
      )
    : syncStoryClipPromptReferences2;
}
function hasMeaningfulMediaValue(value172) {
  if (Array['isArray'](value172)) return value172['length'] > 0;
  if (value172 && typeof value172 === 'object') return Object['keys'](value172)['length'] > 0;
  return normalizeText(value172) !== '';
}
function preserveMediaFields(args15, enabled14, enabled15) {
  if (!enabled15 || !enabled14 || typeof enabled14 !== 'object') return args15;
  const value173 = { ...args15 };
  for (const value174 of MEDIA_FIELDS) {
    if (hasMeaningfulMediaValue(enabled14[value174])) value173[value174] = enabled14[value174];
  }
  return value173;
}
function buildStoryEpisodeClipGenerationSignature(options6 = {}) {
  const value175 = (Array['isArray'](options6?.['shots']) ? options6['shots'] : [])['map']((value176) => ({
    durationSec: normalizeDurationSeconds(value176?.['durationSec'] || value176?.['durationSeconds']),
    startSec: Number['isFinite'](Number(value176?.['startSec'])) ? Number(value176['startSec']) : null,
    endSec: Number['isFinite'](Number(value176?.['endSec'])) ? Number(value176['endSec']) : null,
    time: normalizeText(value176?.['time']),
    visual: normalizeText(value176?.['visual']),
    camera: normalizeText(value176?.['camera']),
    dialogue: normalizeText(value176?.['dialogue']),
    voiceover: normalizeText(value176?.['voiceover']),
    audio: normalizeText(value176?.['audio']),
    assetRefs: normalizeTextArray(value176?.['assetRefs']),
    assetUsages: normalizeStoryAssetUsages(value176?.['assetUsages'])['map']((value177) => ({
      assetRef: normalizeText(value177?.['assetRef']),
      appearanceRef: normalizeText(value177?.['appearanceRef']),
    })),
  }));
  return JSON['stringify']({
    promptMode: normalizeStoryPromptMode(options6?.['promptMode'], { allowDeveloperModes: !![] }),
    durationSec: normalizeDurationSeconds(
      options6?.['durationSec'] || options6?.['durationSeconds'] || options6?.['duration'],
    ),
    script: normalizeText(options6?.['script']),
    creativeIntent: normalizeText(options6?.['creativeIntent']),
    transition: normalizeText(options6?.['transition']),
    prompt: normalizeText(options6?.['prompt']),
    shots: value175,
  });
}
function canPreserveStoryEpisodeClipMedia(value178, enabled16, enabled17) {
  if (!enabled17 || !enabled16 || typeof enabled16 !== 'object') return ![];
  return (
    buildStoryEpisodeClipGenerationSignature(value178) === buildStoryEpisodeClipGenerationSignature(enabled16)
  );
}
function getPlanningRef(options7 = {}, value179 = '') {
  return normalizeText(options7['planningRef'] || options7['ref'] || value179);
}
function getAssetIdentity(options8 = {}) {
  const value180 = ['scene', 'prop']['includes'](options8['kind']) ? options8['kind'] : 'character';
  return value180 + ':' + normalizeText(options8['name'])['toLowerCase']();
}
function findMatchingAsset(value181, value182, value183) {
  const planningRef = getPlanningRef(value182),
    text39 = normalizeText(value182?.['id']),
    assetIdentity = getAssetIdentity(value182);
  return (
    value181['find'](
      (value184) =>
        (text39 && normalizeText(value184?.['id']) === text39) ||
        (planningRef && getPlanningRef(value184) === planningRef) ||
        (normalizeText(value184?.['id']) === 'story-asset-' + (value183 + 1) &&
          !normalizeText(value184?.['name'])) ||
        getAssetIdentity(value184) === assetIdentity,
    ) || null
  );
}
function findMatchingAppearance(list29, error) {
  const planningRef2 = getPlanningRef(error),
    text40 = normalizeText(error?.['name'])['toLowerCase']();
  return (
    list29['find'](
      (value185) =>
        (planningRef2 && getPlanningRef(value185) === planningRef2) ||
        (text40 && normalizeText(value185?.['name'])['toLowerCase']() === text40),
    ) || null
  );
}
function normalizeStoryPlanningAppearance(
  error2 = {},
  {
    assetId: assetId,
    assetRef: assetRef6,
    assetOccurrences: assetOccurrences,
    fallbackPrompt: fallbackPrompt,
    index: index2,
    existingAppearance: existingAppearance,
    preserveMedia: preserveMedia2,
    visualStyle: visualStyle2,
  } = {},
) {
  const planningRef3 = getPlanningRef(error2, assetRef6 + '-appearance-' + (index2 + 1)),
    text41 =
      normalizeText(existingAppearance?.['id']) ||
      createStableStoryPlanningId(
        'appearance',
        assetId,
        planningRef3,
        error2?.['name'],
        String(index2 + 1),
      ),
    value186 = {
      ...error2,
      id: text41,
      planningRef: planningRef3,
      name: normalizeText(error2?.['name']) || (index2 === 0 ? '基础形象' : '形象 ' + (index2 + 1)),
      description: normalizeText(error2?.['description']),
      occurrences: normalizeText(error2?.['occurrences'] || assetOccurrences) || '当前项目',
      sourceChapterIds: normalizeTextArray(error2?.['sourceChapterIds']),
      prompt: sanitizeStoryAssetPublicPromptText(
        ensureStoryVisualStylePrefix(error2?.['prompt'] || fallbackPrompt, visualStyle2),
      ),
      imageUrl: normalizeText(error2?.['imageUrl']),
      error: normalizeText(error2?.['error']),
    };
  return preserveMediaFields(value186, existingAppearance, preserveMedia2);
}
export function normalizeStoryPlanningAsset(
  args16 = {},
  value187 = 0,
  {
    existingAsset: existingAsset = null,
    preserveMedia: preserveMedia = !![],
    visualStyle: visualStyle = '',
  } = {},
) {
  const value188 = ['scene', 'prop']['includes'](args16?.['kind']) ? args16['kind'] : 'character',
    storyAssetDisplayName = normalizeStoryAssetDisplayName(args16?.['name'], value188, value187),
    planningRef4 = getPlanningRef(args16, 'asset-' + (value187 + 1)),
    text42 =
      normalizeText(existingAsset?.['id']) ||
      createStableStoryPlanningId(value188, planningRef4, storyAssetDisplayName, String(value187 + 1)),
    value189 =
      Array['isArray'](args16?.['appearances']) && args16['appearances']['length']
        ? args16['appearances']
        : [
            {
              planningRef: planningRef4 + '-base',
              name: '基础形象',
              occurrences: args16?.['occurrences'],
              sourceChapterIds: args16?.['sourceChapterIds'],
              prompt: args16?.['prompt'] || args16?.['description'],
              imageUrl: args16?.['imageUrl'],
            },
          ],
    value190 = Array['isArray'](existingAsset?.['appearances']) ? existingAsset['appearances'] : [],
    value191 = value189['map']((value192, count10) => {
      const matchingAppearance = findMatchingAppearance(value190, value192);
      return normalizeStoryPlanningAppearance(value192, {
        assetId: text42,
        assetRef: planningRef4,
        assetOccurrences: args16?.['occurrences'],
        fallbackPrompt: count10 === 0 ? args16?.['prompt'] || args16?.['description'] : '',
        index: count10,
        existingAppearance: matchingAppearance,
        preserveMedia: preserveMedia,
        visualStyle: visualStyle,
      });
    }),
    value193 = {
      ...args16,
      id: text42,
      planningRef: planningRef4,
      kind: value188,
      name: storyAssetDisplayName,
      role:
        value188 === 'character'
          ? normalizeStoryCharacterRole(args16?.['role'], storyAssetDisplayName)
          : normalizeText(args16?.['role']),
      description: normalizeText(args16?.['description']),
      voiceDescription: value188 === 'character' ? normalizeText(args16?.['voiceDescription']) : '',
      occurrences: normalizeText(args16?.['occurrences']) || '当前项目',
      sourceChapterIds: normalizeTextArray(args16?.['sourceChapterIds']),
      prompt: normalizeText(value191[0]?.['prompt'] || args16?.['prompt']),
      imageUrl: normalizeText(args16?.['imageUrl']),
      appearances: value191,
    },
    preserveMediaFields2 = preserveMediaFields(value193, existingAsset, preserveMedia),
    text43 = normalizeText(preserveMediaFields2['baseAppearanceId']),
    value194 = value191['find']((value195) => value195['id'] === text43) || value191[0];
  return (
    (preserveMediaFields2['baseAppearanceId'] =
      value188 === 'character' && value191['length'] > 1 ? value194?.['id'] || '' : ''),
    preserveMediaFields2
  );
}
export function clearStoryPlanningForRebuild(options9 = {}) {
  const args17 = options9 && typeof options9 === 'object' && !Array['isArray'](options9) ? options9 : {};
  return {
    ...args17,
    assets: [],
    episodes: (Array['isArray'](args17['episodes']) ? args17['episodes'] : [])['map']((args18) => {
      const durationSeconds = normalizeDurationSeconds(args18?.['estimatedDurationSeconds']);
      return {
        ...args18,
        assetRefs: [],
        assetIds: [],
        characterCount: 0,
        sceneCount: 0,
        propCount: 0,
        coverUrl: '',
        clips: [],
        clipCount: 0,
        durationSec: durationSeconds,
        duration: durationSeconds ? formatStoryClockDuration(durationSeconds) : '--:--',
        status: '待拆分',
      };
    }),
  };
}
export function mergeStoryPlanningAssets(
  list30 = [],
  value196 = [],
  {
    preserveMedia: preserveMedia = !![],
    retainUnmatched: retainUnmatched = ![],
    visualStyle: visualStyle = '',
  } = {},
) {
  const list31 = Array['isArray'](list30) ? list30 : [],
    list32 = Array['isArray'](value196) ? value196 : [],
    enabled18 = new Set(),
    args19 = list32['map']((value197, value198) => {
      const matchingAsset = findMatchingAsset(list31, value197, value198);
      if (matchingAsset) enabled18['add'](matchingAsset);
      const removeStoryCharacterAssetPromptPrefix2 = removeStoryCharacterAssetPromptPrefix(value197);
      return applyStoryCharacterAssetPromptPrefix(
        normalizeStoryPlanningAsset(removeStoryCharacterAssetPromptPrefix2, value198, {
          existingAsset: matchingAsset,
          preserveMedia: preserveMedia,
          visualStyle: visualStyle,
        }),
      );
    });
  return retainUnmatched && preserveMedia
    ? [...args19, ...list31['filter']((value199) => !enabled18['has'](value199))]
    : args19;
}
export function syncStoryPlanningVisualStyle(
  args20 = {},
  { previousStyle: previousStyle = '', visualStyle: visualStyle = '' } = {},
) {
  if (!args20 || typeof args20 !== 'object' || Array['isArray'](args20)) return args20;
  const value200 = Array['isArray'](args20['assets'])
      ? args20['assets']['map']((args21) => {
          const run = (value201) => {
              const value202 =
                  args21?.['kind'] === 'character' &&
                  normalizeText(value201)['startsWith'](STORY_CHARACTER_ASSET_PROMPT_PREFIX),
                value203 = value202 ? stripStoryCharacterAssetPromptPrefix(value201) : value201,
                sanitizeStoryAssetPublicPromptText2 = sanitizeStoryAssetPublicPromptText(
                  replaceStoryVisualStylePrefix(value203, {
                    previousStyle: previousStyle,
                    visualStyle: visualStyle,
                  }),
                );
              return value202
                ? ensureStoryCharacterAssetPromptPrefix(sanitizeStoryAssetPublicPromptText2)
                : sanitizeStoryAssetPublicPromptText2;
            },
            value204 = Array['isArray'](args21?.['appearances'])
              ? args21['appearances']['map']((args22) => ({ ...args22, prompt: run(args22?.['prompt']) }))
              : [];
          return {
            ...args21,
            appearances: value204,
            prompt: value204[0]?.['prompt'] || run(args21?.['prompt']),
          };
        })
      : [],
    value205 = Array['isArray'](args20['episodes'])
      ? args20['episodes']['map']((args23) => ({
          ...args23,
          clips: Array['isArray'](args23?.['clips'])
            ? args23['clips']['map']((args24) => ({
                ...args24,
                prompt: replaceStoryVisualStylePrefix(args24?.['prompt'], {
                  previousStyle: previousStyle,
                  visualStyle: visualStyle,
                }),
              }))
            : [],
        }))
      : [];
  return { ...args20, assets: value200, episodes: value205 };
}
function buildAssetLookup(list33 = []) {
  const value206 = new Map();
  for (const value207 of Array['isArray'](list33) ? list33 : []) {
    const text44 = normalizeText(value207?.['id']),
      planningRef5 = getPlanningRef(value207);
    if (text44) value206['set'](text44, value207);
    if (planningRef5) value206['set'](planningRef5, value207);
  }
  return value206;
}
function resolveAssetIds(value208, value209) {
  return normalizeTextArray(value208)
    ['map']((value210) => normalizeText(value209['get'](value210)?.['id'] || value210))
    ['filter'](Boolean);
}
function countEpisodeAssets(value211, value212, value213) {
  return value211['filter']((value214) => value212['get'](value214)?.['kind'] === value213)['length'];
}
function collectStoryEpisodeAssetRefs(options10 = {}) {
  const value215 = [
    ...(Array['isArray'](options10?.['assetIds']) ? options10['assetIds'] : []),
    ...(Array['isArray'](options10?.['assetRefs']) ? options10['assetRefs'] : []),
  ];
  for (const value216 of Array['isArray'](options10?.['clips']) ? options10['clips'] : []) {
    value215['push'](
      ...(Array['isArray'](value216?.['assetIds']) ? value216['assetIds'] : []),
      ...(Array['isArray'](value216?.['assetRefs']) ? value216['assetRefs'] : []),
      ...(Array['isArray'](value216?.['assetUsages'])
        ? value216['assetUsages']['map']((value217) => value217?.['assetRef'])
        : []),
    );
    for (const value218 of Array['isArray'](value216?.['shots']) ? value216['shots'] : []) {
      value215['push'](
        ...(Array['isArray'](value218?.['assetRefs']) ? value218['assetRefs'] : []),
        ...(Array['isArray'](value218?.['assetUsages'])
          ? value218['assetUsages']['map']((value219) => value219?.['assetRef'])
          : []),
      );
    }
  }
  return normalizeTextArray(value215);
}
export function deriveStoryEpisodeAssetSummary(options11 = {}, value220 = []) {
  const assetLookup = buildAssetLookup(value220),
    list34 = normalizeTextArray(resolveAssetIds(collectStoryEpisodeAssetRefs(options11), assetLookup)),
    list35 = list34['map']((value221) => assetLookup['get'](value221))['filter'](
      (value222, value223, list36) =>
        value222 &&
        ['character', 'scene', 'prop']['includes'](value222['kind']) &&
        list36['indexOf'](value222) === value223,
    );
  return {
    assetRefs: normalizeTextArray(
      list34['map']((value224) => {
        const value225 = assetLookup['get'](value224);
        return value225 ? getPlanningRef(value225, value224) : value224;
      }),
    ),
    assetIds: list34,
    assets: list35,
    characterCount: list35['filter']((value226) => value226['kind'] === 'character')['length'],
    sceneCount: list35['filter']((value227) => value227['kind'] === 'scene')['length'],
    propCount: list35['filter']((value228) => value228['kind'] === 'prop')['length'],
  };
}
function findMatchingEpisode(value229, value230, value231) {
  const text45 = normalizeText(value230?.['id']),
    planningRef6 = getPlanningRef(value230),
    value232 = Math['max'](1, Math['trunc'](Number(value230?.['number']) || value231 + 1));
  return (
    value229['find'](
      (value233, value234) =>
        (text45 && normalizeText(value233?.['id']) === text45) ||
        (planningRef6 && getPlanningRef(value233) === planningRef6) ||
        Math['max'](1, Math['trunc'](Number(value233?.['number']) || value234 + 1)) === value232,
    ) || null
  );
}
function normalizeExistingClips(list37 = []) {
  return Array['isArray'](list37) ? list37['map']((args25) => ({ ...args25 })) : [];
}
function hasStoryClipVideoResult(options12 = {}) {
  if (
    normalizeText(options12?.['result']?.['videoUrl'] || options12?.['videoUrl'] || options12?.['resultUrl'])
  )
    return !![];
  const list38 = Array['isArray'](options12?.['video']?.['results']) ? options12['video']['results'] : [];
  return list38['some'](
    (value235) =>
      value235 &&
      !normalizeText(value235['error']) &&
      normalizeText(
        value235['videoUrl'] ||
          value235['url'] ||
          value235['displayUrl'] ||
          value235['localPath'] ||
          value235['displayLocalPath'],
      ),
  );
}
export function deriveStoryEpisodeStatus(list39 = []) {
  const list40 = Array['isArray'](list39) ? list39 : [];
  if (!list40['length']) return '待拆分';
  const value236 = list40['map']((value237) =>
    normalizeText(value237?.['generation']?.['status'] || value237?.['result']?.['status'])['toLowerCase'](),
  );
  if (
    list40['every'](
      (value238, value239) =>
        ['succeeded', 'success', 'completed', 'done']['includes'](value236[value239]) ||
        hasStoryClipVideoResult(value238),
    )
  )
    return '已完成';
  if (
    value236['some']((value240) =>
      ['running', 'pending', 'queued', 'submitting', 'recovering']['includes'](value240),
    )
  )
    return '生成中';
  if (value236['some']((value241) => ['failed', 'error']['includes'](value241))) return '失败';
  return '待生成';
}
export function normalizeStoryEpisodePlan(
  args26 = {},
  value242 = 0,
  { assets: assets = [], existingEpisode: existingEpisode = null, preserveMedia: preserveMedia = !![] } = {},
) {
  const value243 = Math['max'](1, Math['trunc'](Number(args26?.['number']) || value242 + 1)),
    planningRef7 = getPlanningRef(args26, 'episode-' + value243),
    text46 = normalizeText(existingEpisode?.['id']) || 'episode-' + value243,
    assetLookup2 = buildAssetLookup(assets),
    textArray = normalizeTextArray(args26?.['assetRefs'] || args26?.['assetIds']),
    assetIds = resolveAssetIds(textArray, assetLookup2),
    durationSeconds2 = normalizeDurationSeconds(
      args26?.['estimatedDurationSeconds'] || args26?.['durationSec'],
    ),
    value244 = preserveMedia ? normalizeExistingClips(existingEpisode?.['clips']) : [],
    list41 =
      Array['isArray'](args26?.['clips']) && args26['clips']['length']
        ? normalizeExistingClips(args26['clips'])
        : value244,
    value245 = list41['reduce'](
      (value246, value247) =>
        value246 +
        normalizeDurationSeconds(
          value247?.['durationSec'] || value247?.['durationSeconds'] || value247?.['duration'],
        ),
      0,
    ),
    value248 = value245 || durationSeconds2,
    value249 = {
      ...args26,
      id: text46,
      planningRef: planningRef7,
      number: value243,
      title: normalizeText(args26?.['title']) || '第 ' + value243 + ' 集',
      synopsis: normalizeText(args26?.['synopsis'] || args26?.['content']),
      sourceChapterIds: normalizeTextArray(args26?.['sourceChapterIds']),
      assetRefs: textArray,
      assetIds: assetIds,
      characterCount: countEpisodeAssets(assetIds, assetLookup2, 'character'),
      sceneCount: countEpisodeAssets(assetIds, assetLookup2, 'scene'),
      propCount: countEpisodeAssets(assetIds, assetLookup2, 'prop'),
      estimatedDurationSeconds: durationSeconds2,
      durationSec: value248,
      duration: value248 ? formatStoryClockDuration(value248) : '--:--',
      coverUrl: normalizeText(args26?.['coverUrl']),
      clips: list41,
      clipCount: list41['length'],
      status: deriveStoryEpisodeStatus(list41),
    };
  return preserveMediaFields(value249, existingEpisode, preserveMedia);
}
export function mergeStoryEpisodePlans(
  list42 = [],
  value250 = [],
  { assets: assets = [], preserveMedia: preserveMedia = !![] } = {},
) {
  const value251 = Array['isArray'](list42) ? list42 : [],
    value252 = Array['isArray'](value250) ? value250 : [];
  return value252['map']((value253, value254) =>
    normalizeStoryEpisodePlan(value253, value254, {
      assets: assets,
      existingEpisode: findMatchingEpisode(value251, value253, value254),
      preserveMedia: preserveMedia,
    }),
  );
}
export function isStoryEpisodeScriptComplete(options13 = {}) {
  return (
    normalizeText(options13?.['script']?.['fullText']) !== '' &&
    Array['isArray'](options13?.['script']?.['scenes']) &&
    options13['script']['scenes']['length'] > 0
  );
}
export function getNextStoryEpisodeScriptIndex(list43 = []) {
  const value255 = Array['isArray'](list43) ? list43 : [],
    count11 = value255['findIndex']((value256) => !isStoryEpisodeScriptComplete(value256));
  return count11 < 0 ? value255['length'] : count11;
}
export function canGenerateStoryEpisodeScript(list44 = [], value257 = 0) {
  const value258 = Array['isArray'](list44) ? list44 : [],
    count12 = Math['trunc'](Number(value257));
  return (
    count12 >= 0 && count12 < value258['length'] && getNextStoryEpisodeScriptIndex(value258) === count12
  );
}
export function saveStoryEpisodeScriptDraft(args27 = {}, enabled19 = null) {
  if (!enabled19 || typeof enabled19 !== 'object' || Array['isArray'](enabled19)) return args27;
  return { ...args27, scriptStatus: 'error', scriptDraft: JSON['parse'](JSON['stringify'](enabled19)) };
}
export function mergeStoryEpisodeScript(options14 = {}, args28 = {}) {
  const { scriptDraft: scriptDraft, ...args29 } = options14,
    enabled20 = Array['isArray'](args28?.['scenes'])
      ? args28['scenes']
          ['map']((value259) => ({
            ref: normalizeText(value259?.['ref']),
            heading: normalizeText(value259?.['heading']),
            characters: normalizeTextArray(value259?.['characters']),
            body: normalizeText(value259?.['body']),
          }))
          ['filter']((dom) => dom['heading'] && dom['body'])
      : [],
    text47 = normalizeText(args28?.['fullText']);
  if (!enabled20['length'] || !text47) throw new Error('完整分集剧本缺少场次或正文。');
  const textArray2 = normalizeTextArray([
      ...normalizeTextArray(options14?.['continuityFacts']),
      ...normalizeTextArray(args28?.['continuityFacts']),
    ]),
    value260 =
      args28?.['endingState'] && typeof args28['endingState'] === 'object'
        ? {
            characters: normalizeTextArray(args28['endingState']['characters']),
            props: normalizeTextArray(args28['endingState']['props']),
            unresolvedThreads: normalizeTextArray(args28['endingState']['unresolvedThreads']),
          }
        : options14?.['endingState'];
  return {
    ...args29,
    title: normalizeText(args28?.['title']) || normalizeText(options14?.['title']),
    continuityFacts: textArray2,
    endingState: value260,
    scriptStatus: 'completed',
    script: {
      schemaVersion: Number(args28?.['schemaVersion']) || 1,
      episodeRef: normalizeText(args28?.['episodeRef']) || getPlanningRef(options14),
      scenes: enabled20,
      fullText: text47,
      ...(args28?.['timingReview'] && typeof args28['timingReview'] === 'object'
        ? { timingReview: JSON['parse'](JSON['stringify'](args28['timingReview'])) }
        : {}),
      generatedAt: Date['now'](),
    },
  };
}
export function compileStoryEpisodeScripts(list45 = []) {
  const list46 = Array['isArray'](list45) ? list45 : [],
    value261 = list46['filter'](isStoryEpisodeScriptComplete),
    value262 = value261['map']((value263, value264) => ({
      id: normalizeText(value263?.['id']) || 'episode-' + (value264 + 1),
      title:
        '第 ' +
        Math['max'](1, Math['trunc'](Number(value263?.['number']) || value264 + 1)) +
        ' 集：' +
        (normalizeText(value263?.['title']) || '第 ' + (value264 + 1) + ' 集'),
      content: normalizeText(value263?.['script']?.['fullText']),
    }));
  return {
    completedCount: value261['length'],
    totalCount: list46['length'],
    complete: list46['length'] > 0 && value261['length'] === list46['length'],
    chapters: value262,
    fullText: value262['map']((value265) => value265['content'])['join']('\n\n'),
  };
}
export function invalidateStoryEpisodeScriptsFrom(list47 = [], value266 = 0) {
  const list48 = Array['isArray'](list47) ? list47 : [],
    value267 = Math['max'](0, Math['trunc'](Number(value266) || 0));
  return list48['map']((value268, value269) => {
    if (value269 < value267) return value268;
    const { scriptDraft: scriptDraft2, ...args30 } = value268;
    return {
      ...args30,
      scriptStatus: 'pending',
      script: null,
      clips: [],
      clipCount: 0,
      status: '待生成剧本',
    };
  });
}
export function getStoryEpisodeScriptBatchTargets(list49 = [], value270 = []) {
  const list50 = Array['isArray'](list49) ? list49 : [],
    nextStoryEpisodeScriptIndex = getNextStoryEpisodeScriptIndex(list50);
  if (nextStoryEpisodeScriptIndex >= list50['length']) return [];
  const enabled21 = new Set(normalizeTextArray(value270));
  if (!enabled21['size']) return list50['slice'](nextStoryEpisodeScriptIndex);
  const list51 = [];
  for (let value271 = nextStoryEpisodeScriptIndex; value271 < list50['length']; value271 += 1) {
    const value272 = list50[value271];
    if (!enabled21['has'](normalizeText(value272?.['id']))) break;
    list51['push'](value272);
  }
  return list51;
}
function findMatchingClip(value273, value274, value275, enabled22 = new Set()) {
  const text48 = normalizeText(value274?.['id']),
    planningRef8 = getPlanningRef(value274),
    value276 = Math['max'](1, Math['trunc'](Number(value274?.['number']) || value275 + 1));
  return (
    value273['find'](
      (value277, value278) =>
        !enabled22['has'](value277) &&
        ((text48 && normalizeText(value277?.['id']) === text48) ||
          (planningRef8 && getPlanningRef(value277) === planningRef8) ||
          Math['max'](1, Math['trunc'](Number(value277?.['number']) || value278 + 1)) === value276),
    ) || null
  );
}
export function ensureUniqueStoryEpisodeClipIds(args31 = {}) {
  const value279 = Array['isArray'](args31?.['clips']) ? args31['clips'] : [],
    text49 = normalizeText(args31?.['id']) || 'episode-1',
    enabled23 = new Set();
  let value280 = ![];
  const value281 = value279['map']((args32, value282) => {
    const text50 = normalizeText(args32?.['id']);
    if (text50 && !enabled23['has'](text50)) return (enabled23['add'](text50), args32);
    const value283 = text49 + '-clip-' + (value282 + 1);
    let value284 = value283,
      value285 = 2;
    while (enabled23['has'](value284)) {
      ((value284 = value283 + '-' + value285), (value285 += 1));
    }
    (enabled23['add'](value284), (value280 = !![]));
    const value286 = { ...args32, id: value284 };
    if (text50) {
      for (const value287 of MEDIA_FIELDS) delete value286[value287];
    }
    return value286;
  });
  return value280 ? { ...args31, clips: value281 } : args31;
}
function resolveStoryClipContinuitySceneKey(options15 = {}, value288 = new Map()) {
  const text51 = normalizeText(options15?.['continuitySceneKey'] || options15?.['sourceSceneRef']);
  if (text51) return text51;
  const list52 = normalizeStoryAssetUsages(
      (Array['isArray'](options15?.['shots']) ? options15['shots'] : [])['flatMap'](
        (value289) => value289?.['assetUsages'] || [],
      ),
    ),
    list53 = [
      ...new Set(
        list52['flatMap']((value290) => {
          const {
            assetRef: assetRef7,
            appearanceRef: appearanceRef5,
            asset: asset10,
          } = resolveStoryAssetUsage(value290, value288);
          if (asset10?.['kind'] !== 'scene') return [];
          return [getPlanningRef(asset10, assetRef7) + '|' + appearanceRef5];
        }),
      ),
    ];
  return list53['length'] === 1 ? list53[0] : '';
}
function addStoryEpisodeClipContinuityHandoffs(list54 = [], value291 = []) {
  const list55 = Array['isArray'](list54) ? list54 : [],
    storyAssetUsageLookup9 = buildStoryAssetUsageLookup(value291),
    value292 = list55['map']((value293) =>
      resolveStoryClipContinuitySceneKey(value293, storyAssetUsageLookup9),
    );
  return list55['map']((args33, count13) => {
    const value294 = count13 > 0 ? list55[count13 - 1] : null,
      enabled24 = Boolean(value294 && value292[count13] && value292[count13] === value292[count13 - 1]);
    if (!enabled24) {
      if (!args33?.['continuityHandoff']) return args33;
      const value295 = { ...args33 };
      return (delete value295['continuityHandoff'], value295);
    }
    const value296 = Array['isArray'](value294?.['shots']) ? value294['shots']['at'](-1) : null,
      value297 = Array['isArray'](args33?.['shots']) ? args33['shots'][0] : null;
    return {
      ...args33,
      continuityHandoff: {
        previousExitState: normalizeText(value296?.['visual']),
        previousEndCamera: normalizeText(value296?.['camera']),
        currentEntryState: normalizeText(value297?.['visual']),
        currentOpeningCamera: normalizeText(value297?.['camera']),
        transitionFromPrevious: normalizeText(value297?.['transitionFromPrevious']),
      },
    };
  });
}
export function normalizeStoryEpisodeClip(
  args34 = {},
  value298 = 0,
  {
    episodeId: episodeId = 'episode-1',
    assets: assets = [],
    existingClip: existingClip = null,
    preserveMedia: preserveMedia = !![],
    visualStyle: visualStyle = '',
    promptMode: promptMode = args34?.['promptMode'],
    includeDialogueVoiceGuidance: includeDialogueVoiceGuidance = ![],
    sourceMode: sourceMode = '',
  } = {},
) {
  const storyPromptMode2 = normalizeStoryPromptMode(promptMode, { allowDeveloperModes: !![] }),
    value299 = Math['max'](1, Math['trunc'](Number(args34?.['number']) || value298 + 1)),
    planningRef9 = getPlanningRef(args34, 'clip-' + value299),
    text52 = normalizeText(existingClip?.['id']) || episodeId + '-clip-' + value299,
    value300 = Array['isArray'](args34?.['shots'])
      ? args34['shots']
          ['map'](normalizeStoryEpisodeShot)
          ['filter']((value301) => value301['durationSec'] > 0)
      : [],
    storyMinimaxH3ClipShots = normalizeStoryMinimaxH3ClipShots(value300, storyPromptMode2),
    value302 =
      sourceMode === 'video-replication' && isStorySeedance25PromptMode(storyPromptMode2)
        ? completeReplicationScenePropUsages(storyMinimaxH3ClipShots, assets)
        : storyMinimaxH3ClipShots,
    value303 = value302['length']
      ? value302['reduce']((value304, value305) => value304 + value305['durationSec'], 0)
      : normalizeDurationSeconds(
          args34?.['durationSec'] || args34?.['durationSeconds'] || args34?.['duration'],
        ),
    assetLookup3 = buildAssetLookup(assets),
    value306 = value302['length']
      ? normalizeStoryAssetUsages(value302['flatMap']((value307) => value307['assetUsages']))
      : normalizeStoryAssetUsages(args34?.['assetUsages'], args34?.['assetRefs'] || args34?.['assetIds']),
    storyAssetRefs = deriveStoryAssetRefs(value306),
    text53 = normalizeText(args34?.['creativeIntent']),
    text54 = normalizeText(args34?.['transition']),
    value308 = {
      ...args34,
      id: text52,
      planningRef: planningRef9,
      number: value299,
      title: normalizeText(args34?.['title']) || '片段 ' + value299,
      script: normalizeText(args34?.['script']),
      promptMode: storyPromptMode2,
      creativeIntent: text53,
      transition: text54,
      shots: value302,
      prompt: buildStoryEpisodeClipPrompt({
        clip: { ...args34, creativeIntent: text53, transition: text54, shots: value302 },
        assets: assets,
        visualStyle: visualStyle,
        promptMode: storyPromptMode2,
        includeDialogueVoiceGuidance: includeDialogueVoiceGuidance,
        sourceMode: sourceMode,
      }),
      durationSec: value303,
      duration: formatStoryClipDuration(value303),
      assetUsages: value306,
      assetRefs: storyAssetRefs,
      assetIds: resolveAssetIds(storyAssetRefs, assetLookup3),
      result:
        args34?.['result'] && typeof args34['result'] === 'object'
          ? { ...args34['result'] }
          : { status: 'idle', taskId: '', videoUrl: '', error: '' },
    };
  return preserveMediaFields(
    value308,
    existingClip,
    canPreserveStoryEpisodeClipMedia(value308, existingClip, preserveMedia),
  );
}
export function insertStoryEpisodeClip(
  args35 = {},
  value309 = '',
  { durationSec: durationSec = 5, promptMode: promptMode = args35?.['promptMode'] } = {},
) {
  const list56 = Array['isArray'](args35?.['clips']) ? args35['clips'] : [],
    count14 = list56['findIndex']((value310) => normalizeText(value310?.['id']) === normalizeText(value309));
  if (count14 < 0) return null;
  const text55 = normalizeText(args35?.['id']) || 'episode-1',
    value311 = new Set(list56['map']((value312) => normalizeText(value312?.['id']))['filter'](Boolean));
  let value313 = list56['length'] + 1,
    value314 = text55 + '-clip-manual-' + value313;
  while (value311['has'](value314)) {
    ((value313 += 1), (value314 = text55 + '-clip-manual-' + value313));
  }
  const durationSeconds3 = normalizeDurationSeconds(durationSec) || 5,
    value315 = {
      id: value314,
      planningRef: 'manual-clip-' + value313,
      number: count14 + 2,
      title: '新片段',
      script: '',
      promptMode: normalizeText(promptMode)
        ? normalizeStoryPromptMode(promptMode, { allowDeveloperModes: !![] })
        : '',
      creativeIntent: '',
      transition: '',
      shots: [],
      prompt: '',
      durationSec: durationSeconds3,
      duration: formatStoryClipDuration(durationSeconds3),
      assetUsages: [],
      assetRefs: [],
      assetIds: [],
      result: { status: 'idle', taskId: '', videoUrl: '', error: '' },
    },
    list57 = [...list56['slice'](0, count14 + 1), value315, ...list56['slice'](count14 + 1)]['map'](
      (args36, value316) => ({ ...args36, number: value316 + 1 }),
    ),
    value317 = list57['reduce'](
      (value318, value319) =>
        value318 +
        normalizeDurationSeconds(
          value319?.['durationSec'] || value319?.['durationSeconds'] || value319?.['duration'],
        ),
      0,
    );
  return {
    episode: {
      ...args35,
      clips: list57,
      clipCount: list57['length'],
      durationSec: value317,
      duration: formatStoryClockDuration(value317),
      status: deriveStoryEpisodeStatus(list57),
    },
    clip: list57[count14 + 1],
  };
}
export function removeStoryEpisodeClip(args37 = {}, value320 = '') {
  const list58 = Array['isArray'](args37?.['clips']) ? args37['clips'] : [],
    count15 = list58['findIndex']((value321) => normalizeText(value321?.['id']) === normalizeText(value320));
  if (count15 < 0) return null;
  const value322 = list58[count15],
    list59 = list58['filter']((value323, value324) => value324 !== count15)['map']((args38, value325) => ({
      ...args38,
      number: value325 + 1,
    })),
    value326 = list59['reduce'](
      (value327, value328) =>
        value327 +
        normalizeDurationSeconds(
          value328?.['durationSec'] || value328?.['durationSeconds'] || value328?.['duration'],
        ),
      0,
    );
  return {
    episode: {
      ...args37,
      clips: list59,
      clipCount: list59['length'],
      durationSec: value326,
      duration: formatStoryClockDuration(value326),
      status: deriveStoryEpisodeStatus(list59),
    },
    removedClip: value322,
    nextClip: list59[Math['min'](count15, list59['length'] - 1)] || null,
  };
}
export function mergeStoryEpisodeSplit(
  args39 = {},
  value329 = {},
  {
    assets: assets = [],
    preserveMedia: preserveMedia = !![],
    visualStyle: visualStyle = '',
    promptMode: promptMode = args39?.['promptMode'] || 'seedance-2.0',
    videoModelId: videoModelId = '',
    includeContinuityHandoffs: includeContinuityHandoffs = ![],
    includeDialogueVoiceGuidance: includeDialogueVoiceGuidance = ![],
    sourceMode: sourceMode = '',
  } = {},
) {
  const storyPromptMode3 = normalizeStoryPromptMode(promptMode, { allowDeveloperModes: !![] }),
    value330 = Array['isArray'](args39?.['clips']) ? args39['clips'] : [],
    value331 = Array['isArray'](value329?.['clips']) ? value329['clips'] : [],
    value332 = includeContinuityHandoffs ? addStoryEpisodeClipContinuityHandoffs(value331, assets) : value331,
    text56 = normalizeText(args39?.['id']) || 'episode-1',
    value333 = new Set(),
    value334 = value332['map']((args40, value335) => {
      const matchingClip = findMatchingClip(value330, args40, value335, value333);
      if (matchingClip) value333['add'](matchingClip);
      return normalizeStoryEpisodeClip(
        { ...args40, title: formatGeneratedStoryClipTitle(value335) },
        value335,
        {
          episodeId: text56,
          assets: assets,
          existingClip: matchingClip,
          preserveMedia: preserveMedia,
          visualStyle: visualStyle,
          promptMode: storyPromptMode3,
          includeDialogueVoiceGuidance: includeDialogueVoiceGuidance,
          sourceMode: sourceMode,
        },
      );
    }),
    uniqueStoryEpisodeClipIds = ensureUniqueStoryEpisodeClipIds({ id: text56, clips: value334 })['clips'],
    value336 = uniqueStoryEpisodeClipIds['reduce'](
      (value337, value338) => value337 + value338['durationSec'],
      0,
    ),
    storyEpisodeAssetSummary = deriveStoryEpisodeAssetSummary(
      { ...args39, clips: uniqueStoryEpisodeClipIds },
      assets,
    ),
    value339 = {
      ...args39,
      storyboardStale: ![],
      promptMode: storyPromptMode3,
      ...(normalizeText(videoModelId) ? { videoModelId: normalizeText(videoModelId) } : {}),
      assetRefs: storyEpisodeAssetSummary['assetRefs'],
      assetIds: storyEpisodeAssetSummary['assetIds'],
      characterCount: storyEpisodeAssetSummary['characterCount'],
      sceneCount: storyEpisodeAssetSummary['sceneCount'],
      propCount: storyEpisodeAssetSummary['propCount'],
      clips: uniqueStoryEpisodeClipIds,
      clipCount: uniqueStoryEpisodeClipIds['length'],
      durationSec: value336,
      duration: formatStoryClockDuration(value336),
      status: deriveStoryEpisodeStatus(uniqueStoryEpisodeClipIds),
      ...(typeof value329?.['rawResponse'] === 'string' ? { splitRawResponse: value329['rawResponse'] } : {}),
    };
  return preserveMediaFields(value339, args39, preserveMedia);
}
function isStoryEpisodeSplitTransportErrorEnvelope(value340) {
  const text57 = normalizeText(value340);
  if (!text57) return ![];
  let enabled25;
  try {
    enabled25 = JSON['parse'](text57);
  } catch {
    return ![];
  }
  if (!enabled25 || typeof enabled25 !== 'object' || Array['isArray'](enabled25)) return ![];
  const value341 = Object['keys'](enabled25),
    map2 = new Set(['error', 'code', 'message', 'status', 'statusCode', 'details']);
  return (
    Object['prototype']['hasOwnProperty']['call'](enabled25, 'error') &&
    value341['length'] > 0 &&
    value341['every']((value342) => map2['has'](value342))
  );
}
export function discardStaleStoryEpisodeSplitTransportDraft(options16 = {}) {
  const enabled26 = Array['isArray'](options16?.['clips']) ? options16['clips'] : [],
    enabled27 = options16?.['splitDraft'];
  if (!enabled26['length'] || !enabled27 || typeof enabled27 !== 'object' || Array['isArray'](enabled27))
    return options16;
  const value343 =
    (Array['isArray'](enabled27['clips']) && enabled27['clips']['length'] > 0) ||
    (Array['isArray'](enabled27['items']) &&
      enabled27['items']['some'](
        (value344) =>
          (Array['isArray'](value344?.['clips']) && value344['clips']['length'] > 0) ||
          (Array['isArray'](value344?.['rawClips']) && value344['rawClips']['length'] > 0),
      ));
  if (value343 || !isStoryEpisodeSplitTransportErrorEnvelope(enabled27['rawResponse'])) return options16;
  const { splitDraft: splitDraft, ...args41 } = options16;
  return args41;
}
