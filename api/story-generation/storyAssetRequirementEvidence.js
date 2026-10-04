export const STORY_ASSET_REQUIREMENT_EVIDENCE_SCHEMA_VERSION = 0x1;
const STORY_ASSET_REQUIREMENT_TIERS = Object['freeze']({
    hard: 'hard-required',
    optional: 'optional-candidate',
    ignored: 'ignored',
  }),
  STORY_ASSET_REQUIREMENT_TIER_PRIORITY = Object['freeze']({
    [STORY_ASSET_REQUIREMENT_TIERS['ignored']]: 0x0,
    [STORY_ASSET_REQUIREMENT_TIERS['optional']]: 0x1,
    [STORY_ASSET_REQUIREMENT_TIERS['hard']]: 0x2,
  }),
  STORY_TITLE_NUMBER_PATTERN = '(?:\x5cd+|[零〇一二三四五六七八九十百千万两廿卅]+)',
  STORY_STRUCTURAL_TITLE_PREFIX_PATTERN = new RegExp(
    [
      '(?:',
      '第\\s*' + STORY_TITLE_NUMBER_PATTERN + '\x5cs*(?:集|章|节|幕|回|场)',
      '|(?:episode|ep|chapter|scene)\x5cs*[-_]?\x5cs*\x5cd+',
      '|(?:本集|本章|本节|本幕|本回|本场)(?:标题)?',
      '|(?:集|章|章节|幕|场)标题',
      ')',
      '\\s*[：:—\\-·丨|】\\]）)]*\\s*$',
    ]['join'](''),
    'iu',
  ),
  STORY_PROP_PHYSICAL_ACTION_PATTERN =
    /(?:拿着|拿起|拾起|捡起|掏出|取出|抽出|递出|递给|交出|交给|收起|藏起|放下|摆下|摊开|展开|翻开|合上|撕开|撕毁|焚烧|烧毁|签署|签下|签字|盖章|按下手印|按手印|逐页核对|逐页翻看|翻页|装订|复印|打印|扫描|夹在|塞进|装进|举起|握住|抱着|压在|放在|摆在|贴在|钉在|锁进)/u,
  STORY_PROP_MATERIAL_CUE_PATTERN =
    /(?:一本|一册|一卷|一份|这本|那本|该本|原件|复印件|纸质版|纸页|页码|封面|封底|签章|公章|印章|文件袋|档案袋)/u,
  STORY_PROP_DECLARATION_PATTERN =
    /(?:^|[\r\n])\s*(?:关键|重要)?道具(?:清单)?\s*[：:][^，。！？；\r\n]{0,80}$/u,
  STORY_PROP_CLAUSE_BOUNDARY_PATTERN = /[，。！？；,!?;\r\n]/u,
  STORY_ASSET_LOCAL_CANDIDATE_PLACEHOLDER_PATTERN =
    /^(?:无|没有|未发现|未识别)(?:相应|对应|相关)?(?:实体|角色|人物|场景|地点|道具)?$/u,
  STORY_CHARACTER_NARRATIVE_FRAGMENT_PATTERN =
    /(?:却|忽(?:的|然)?|猛地|缓缓|正在|已经|很是|立刻|随即|转身|起身|坐下|说道|问道|答道|笑道|哭道|走向|看向|望着|盯着|拿起|放下|点头|摇头|皱眉)/u,
  STORY_ASSET_OPTIONAL_CANDIDATE_EVIDENCE_CHARACTERS = 0xa0,
  STORY_ASSET_CROSS_KIND_WINNER_MIN_CONFIDENCE = 0.75,
  STORY_ASSET_CROSS_KIND_WINNER_MIN_MARGIN = 0.15,
  STORY_PROP_DIRECT_OBJECT_ACTION_PATTERN =
    /(?:取出|拿起|拾起|捡起|掏出|抽出|递出|交出|手持|握住|举起|使用)\s*(?:了|着)?\s*((?:《[^》\r\n]{1,24}》|(?:一(?:个|只|把|张|本|册|枚|块|台|部|支|瓶|杯|盒|箱|套|卷|件|份)\s*)?[\p{L}\p{N}·•._-]{2,24}?))(?=\s*(?:看(?:了)?(?:一?眼)|抿(?:了)?(?:一?口)|拨(?:打)?(?:了)?(?:电话|号)|放在|放到|递给|交给|交出|核对|检查|查看|读取|读出|打开|连接|插入|启动|关闭|收起|继续|随后|转身|离开|返回|，|。|；|！|？|,|;|!|\?|$))/gu,
  STORY_PROP_BA_ACTION_PATTERN =
    /(?:把|将)\s*((?:《[^》\r\n]{1,24}》|(?:一(?:个|只|把|张|本|册|枚|块|台|部|支|瓶|盒|箱|套|卷|件|份)\s*)?[\p{L}\p{N}·•._-]{2,24}?))\s*(?:放入|放进|塞入|装入|递出|递给|交出|交给|拿起|取出|使用)/gu,
  STORY_PROP_CANDIDATE_NOISE_PATTERN = new RegExp(
    [
      '^(?:编号|标记|时间戳|坐标)(?:[-_：:]?\x5cp{L}*\x5cd*)?$',
      '(?:^|[-_])(?:MID|MARK|MARKER|SCENE|EPISODE|EP)[-_]?\\d+(?:$|[-_])',
      '^G?\\d+[-_](?:MID|MARK)',
    ]['join']('|'),
    'iu',
  ),
  STORY_PROP_LEADING_MEASURE_PATTERN =
    /^一(?:个|只|把|张|本|册|枚|块|台|部|支|瓶|杯|盒|箱|套|卷|件|份|根|条|沓)\s*/u,
  STORY_PROP_PACKAGING_DESCRIPTION_PATTERN =
    /^(?:(?:外面|外层|外部)\s*)?(?:(?:用|由)\s*)?[\p{L}\p{N}·•._-]{1,16}(?:包装|包裹|盛装|装着|包着)的([\p{L}\p{N}·•._-]{2,12})$/u,
  STORY_PROP_TRAILING_PREDICATE_PATTERN =
    /(?:看(?:了)?(?:一?眼)|抿(?:了)?(?:一?口)|拨(?:打)?(?:了)?(?:电话|号))$/u,
  STORY_PROP_LEADING_STATE_PATTERN =
    /^(?:(?:早已)?从(?:口袋|内袋|怀里|包里|背包|抽屉)[^的，。；]{0,8}(?:取出|拿出|掏出)的|(?:椅背|桌面|桌上|地面|墙上|柜内|包里|口袋|内袋)上的|(?:折好|打印好?|永久沉默|随身)的)/u,
  STORY_PROP_TRAILING_ACTION_FRAGMENT_PATTERN =
    /(?:快速翻阅|贴身收好|逆时针旋转[零〇一二三四五六七八九十百千万两\d]+圈|攥在手心|从(?:口袋|内袋)|折好|翻开|记录|穿上)$/u,
  STORY_PROP_NON_ASSET_FRAGMENT_PATTERN = new RegExp(
    [
      '^(?:[零〇一二三四五六七八九十百千万两\\d]+(?:样|件|个)?)?(?:东西|物件)$',
      '^(?:(?:里面|其中)的|这些|那些)?(?:材料|内容)$',
      '^(?:握了握|拿了拿|看了看|翻了翻)$',
      '^(?:[\x5cp{L}\x5cp{N}·•._-]{1,12}的)?(?:手|手指|手腕|手臂|肩|肩膀|头|脸|眼睛|嘴|腿|脚)$',
      '(?:记忆提|分别)$',
    ]['join']('|'),
    'u',
  );
function normalizeText(value) {
  return typeof value === 'string' ? value['trim']() : '';
}
function normalizeNameKey(item) {
  return normalizeText(item)['normalize']('NFKC')['replace'](/\s+/gu, '')['toLocaleLowerCase']();
}
function normalizeStringArray(list = []) {
  return [...new Set((Array['isArray'](list) ? list : [])['map'](normalizeText)['filter'](Boolean))];
}
function getLocalCandidateConfidence(key, index, result) {
  const list2 = (Array['isArray'](key?.['localEntityEvidence']) ? key['localEntityEvidence'] : [])
    ['filter']((response) => response?.['kind'] === index && normalizeText(response?.['text']) === result)
    ['map']((data) => Number(data?.['probability']))
    ['filter'](Number['isFinite']);
  return list2['length'] ? Math['max'](...list2) : 0x0;
}
function stripLocalCandidateSummary(options = '') {
  return normalizeText(options)
    ['replace'](/PP-UIE\s*本地候选：[^\r\n]*(?:\r?\n\s*证据原文：)?/giu, '')
    ['replace'](/证据原文：/gu, '')
    ['trim']();
}
function isUsableLocalCandidateName(target, source) {
  const args = normalizeText(source),
    count = [...args]['length'];
  if (
    count < 0x2 ||
    count > 0x30 ||
    /[\r\n]/u['test'](args) ||
    STORY_ASSET_LOCAL_CANDIDATE_PLACEHOLDER_PATTERN['test'](args)
  )
    return ![];
  if (target === 'prop' && isNoisyStoryPropCandidateName(args)) return ![];
  if (target !== 'character') return !![];
  return (
    count <= 0x8 &&
    /^[\p{Script=Han}A-Za-z0-9·•._-]+$/u['test'](args) &&
    !STORY_CHARACTER_NARRATIVE_FRAGMENT_PATTERN['test'](args)
  );
}
function isNoisyStoryPropCandidateName(next = '') {
  const args2 = normalizeText(next)['replace'](STORY_PROP_LEADING_MEASURE_PATTERN, '')['trim']();
  if (
    [...args2]['length'] < 0x2 ||
    [...args2]['length'] > 0x18 ||
    STORY_PROP_CANDIDATE_NOISE_PATTERN['test'](args2) ||
    /(?:中段标记|场次标记|剧情标记|唯一标记|核对编号)$/u['test'](args2)
  )
    return !![];
  return !/^[\p{L}\p{N}·•._-]+$/u['test'](args2);
}
function normalizeStoryPropActionCandidate(current = '') {
  let text = normalizeText(current)
    ['replace'](STORY_PROP_LEADING_MEASURE_PATTERN, '')
    ['replace'](/^(?:这|那|该)(?:个|只|把|张|本|册|枚|块|台|部|支|瓶|盒|箱|套|卷|件|份|根|条|沓)?/u, '')
    ['replace'](/^[《“”"'‘’]+|[》“”"'‘’]+$/gu, '')
    ['replace'](STORY_PROP_TRAILING_PREDICATE_PATTERN, '')
    ['trim']();
  for (let count2 = 0x0; count2 < 0x3; count2 += 0x1) {
    const entry = text;
    text = text['replace'](STORY_PROP_TRAILING_ACTION_FRAGMENT_PATTERN, '')
      ['replace'](STORY_PROP_LEADING_STATE_PATTERN, '')
      ['trim']();
    if (text === entry) break;
  }
  const text2 = normalizeText(text['match'](STORY_PROP_PACKAGING_DESCRIPTION_PATTERN)?.[0x1] || text);
  if (!text2 || /[和及、]/u['test'](text2) || STORY_PROP_NON_ASSET_FRAGMENT_PATTERN['test'](text2)) return '';
  return isNoisyStoryPropCandidateName(text2) ? '' : text2;
}
function createStoryPropActionEvidence(list3, record, payload) {
  const count3 = list3['indexOf'](payload, Math['max'](0x0, record)),
    handle = count3 >= 0x0 ? count3 : Math['max'](0x0, record),
    state = Math['max'](0x0, handle - 0x30);
  return list3['slice'](
    state,
    Math['min'](list3['length'], state + STORY_ASSET_OPTIONAL_CANDIDATE_EVIDENCE_CHARACTERS),
  )
    ['replace'](/\s+/gu, '\x20')
    ['trim']();
}
export function createStoryAssetActionPropCandidates(list4 = []) {
  const map = new Map();
  return (
    (Array['isArray'](list4) ? list4 : [])['forEach']((dom) => {
      const args3 = normalizeText(dom?.['body']),
        text3 = normalizeText(dom?.['ref']),
        text4 = normalizeText(dom?.['episodeRef']);
      if (!args3 || !text3) return;
      const list5 = [
        ...args3['matchAll'](STORY_PROP_DIRECT_OBJECT_ACTION_PATTERN),
        ...args3['matchAll'](STORY_PROP_BA_ACTION_PATTERN),
      ]['sort']((config, scope) => (Number(config['index']) || 0x0) - (Number(scope['index']) || 0x0));
      list5['forEach']((input) => {
        const storyPropActionCandidate = normalizeStoryPropActionCandidate(input[0x1]);
        if (!storyPropActionCandidate) return;
        const nameKey = normalizeNameKey(storyPropActionCandidate),
          name = map['get'](nameKey),
          sourceSceneRefs = normalizeStringArray([...(name?.['sourceSceneRefs'] || []), text3]),
          sourceChapterIds = normalizeStringArray([...(name?.['sourceChapterIds'] || []), text4]);
        map['set'](nameKey, {
          name: name?.['name'] || storyPropActionCandidate,
          evidence:
            name?.['evidence'] ||
            createStoryPropActionEvidence(args3, Number(input['index']) || 0x0, storyPropActionCandidate),
          sourceSceneRefs: sourceSceneRefs,
          sourceChapterIds: sourceChapterIds,
          confidence: 0x1,
        });
      });
    }),
    [...map['values']()]
  );
}
function createLocalCandidateEvidence(dom2, dom3, output, list6) {
  const list7 = normalizeText(dom3?.['body']) || stripLocalCandidateSummary(dom2?.['body']),
    value2 = (Array['isArray'](dom2?.['localEntityEvidence']) ? dom2['localEntityEvidence'] : [])['find'](
      (response2) => response2?.['kind'] === output && normalizeText(response2?.['text']) === list6,
    ),
    value3 = Math['max'](0x0, Math['trunc'](Number(value2?.['start']) || 0x0)),
    count4 = list7['slice'](value3, value3 + list6['length']) === list6 ? value3 : list7['indexOf'](list6);
  if (count4 < 0x0) return '';
  const value4 = Math['max'](0x0, count4 - 0x38);
  return list7['slice'](
    value4,
    Math['min'](list7['length'], value4 + STORY_ASSET_OPTIONAL_CANDIDATE_EVIDENCE_CHARACTERS),
  )
    ['replace'](/\s+/gu, '\x20')
    ['trim']();
}
function collectVerifiedLocalCandidates(options2 = {}, value5 = null) {
  return ['character', 'scene', 'prop']['flatMap']((kind) =>
    normalizeStringArray(options2?.['localEntityCandidates']?.[kind])
      ['filter']((value6) => isUsableLocalCandidateName(kind, value6))
      ['map']((name2) => ({
        kind: kind,
        name: name2,
        confidence: getLocalCandidateConfidence(options2, kind, name2),
        evidence: createLocalCandidateEvidence(options2, value5, kind, name2),
      }))
      ['filter']((value7) => value7['evidence']),
  );
}
function resolveStoryAssetCandidateWinnerKindsByName(list8 = []) {
  const map2 = new Map();
  return (
    list8['forEach'](({ key: key2, kind: kind2, confidence: confidence }) => {
      const map3 = map2['get'](key2) || new Map();
      (map3['set'](kind2, Math['max'](Number(map3['get'](kind2)) || 0x0, Number(confidence) || 0x0)),
        map2['set'](key2, map3));
    }),
    new Map(
      [...map2]['flatMap'](([value8, map4]) => {
        if (map4['size'] === 0x1) return [[value8, [...map4['keys']()][0x0]]];
        const value9 = [...map4]
            ['map'](([kind3, confidence2]) => ({ kind: kind3, confidence: confidence2 }))
            ['sort']((value10, value11) => value11['confidence'] - value10['confidence']),
          value12 = value9[0x0],
          value13 = value9[0x1];
        if (
          value12['confidence'] >= STORY_ASSET_CROSS_KIND_WINNER_MIN_CONFIDENCE &&
          value12['confidence'] - value13['confidence'] + Number['EPSILON'] >=
            STORY_ASSET_CROSS_KIND_WINNER_MIN_MARGIN
        )
          return [[value8, value12['kind']]];
        return [];
      }),
    )
  );
}
function createHardRequiredStoryAssetKindsByName(list9 = [], value14 = null) {
  const storyAssetRequirementEvidencePlan = createStoryAssetRequirementEvidencePlan(list9),
    map5 = new Map();
  return (
    ['character', 'scene', 'prop']['forEach']((value15) => {
      const list10 = normalizeStringArray([
        ...getHardRequiredStoryAssetNames(storyAssetRequirementEvidencePlan, value15),
        ...(Array['isArray'](value14?.[value15]) ? value14[value15] : []),
      ]);
      list10['forEach']((value16) => {
        const nameKey2 = normalizeNameKey(value16),
          value17 = map5['get'](nameKey2) || new Set();
        (value17['add'](value15), map5['set'](nameKey2, value17));
      });
    }),
    map5
  );
}
function filterCandidatesByHardRequiredKinds(list11 = [], map6 = new Map()) {
  return list11['filter']((event) => {
    const map7 = map6['get'](event['key']);
    if (!map7) return !![];
    return map7['size'] === 0x1 && map7['has'](event['kind']);
  });
}
function createAnchorFirstIndexOrder(value18) {
  const enabled = Math['max'](0x0, Math['trunc'](Number(value18) || 0x0));
  if (!enabled) return [];
  const list12 = [],
    map8 = new Set(),
    handler = (value19) => {
      const value20 = Math['max'](0x0, Math['min'](enabled - 0x1, Math['trunc'](value19)));
      if (map8['has'](value20)) return;
      (map8['add'](value20), list12['push'](value20));
    };
  (handler(0x0), handler(Math['floor']((enabled - 0x1) / 0x2)), handler(enabled - 0x1));
  while (list12['length'] < enabled) {
    let value21 = -0x1,
      value22 = -0x1;
    for (let value23 = 0x0; value23 < enabled; value23 += 0x1) {
      if (map8['has'](value23)) continue;
      const value24 = Math['min'](...list12['map']((value25) => Math['abs'](value25 - value23)));
      value24 > value22 && ((value21 = value23), (value22 = value24));
    }
    handler(value21);
  }
  return list12;
}
function createFairSourceRefOrder(list13 = [], list14 = []) {
  const map9 = new Set(list14['flatMap']((value26) => value26['sourceSceneRefs'] || [])),
    list15 = normalizeStringArray(
      (Array['isArray'](list13) ? list13 : [])
        ['map']((value27) => value27?.['ref'])
        ['filter']((value28) => map9['has'](normalizeText(value28))),
    ),
    map10 = new Set(list15);
  return (
    list14['flatMap']((value29) => value29['sourceSceneRefs'] || [])['forEach']((value30) => {
      const text5 = normalizeText(value30);
      text5 && !map10['has'](text5) && (map10['add'](text5), list15['push'](text5));
    }),
    createAnchorFirstIndexOrder(list15['length'])['map']((value31) => list15[value31])
  );
}
function selectFairSourceRefs(list16 = [], value32 = [], value33 = 0x3) {
  const map11 = new Map(
      (Array['isArray'](value32) ? value32 : [])['map']((value34, value35) => [
        normalizeText(value34?.['ref']),
        value35,
      ]),
    ),
    list17 = normalizeStringArray(list16)['sort'](
      (value36, value37) =>
        (map11['get'](value36) ?? Number['MAX_SAFE_INTEGER']) -
        (map11['get'](value37) ?? Number['MAX_SAFE_INTEGER']),
    );
  return createAnchorFirstIndexOrder(list17['length'])
    ['slice'](0x0, Math['max'](0x1, Math['trunc'](Number(value33) || 0x0)))
    ['map']((value38) => list17[value38]);
}
function mergeStoryAssetOptionalCandidates(list18 = [], value39 = []) {
  const map12 = new Map();
  return (
    list18['forEach']((event2) => {
      const args4 = map12['get'](event2['key']);
      if (!args4) {
        map12['set'](event2['key'], {
          ...event2,
          sourceSceneRefs: normalizeStringArray(event2['sourceSceneRefs']),
        });
        return;
      }
      ((args4['sourceSceneRefs'] = normalizeStringArray([
        ...args4['sourceSceneRefs'],
        ...(event2['sourceSceneRefs'] || []),
      ])),
        (Number(event2['confidence']) > Number(args4['confidence']) ||
          (Number(event2['confidence']) === Number(args4['confidence']) &&
            String(event2['evidence'] || '')['length'] > String(args4['evidence'] || '')['length'])) &&
          ((args4['evidence'] = event2['evidence']), (args4['confidence'] = event2['confidence'])));
    }),
    [...map12['values']()]['map']((args5) => ({
      ...args5,
      sourceSceneRefs: selectFairSourceRefs(args5['sourceSceneRefs'], value39, 0x3),
    }))
  );
}
function selectBudgetedStoryAssetOptionalCandidates(
  kind4,
  list19 = [],
  value40 = [],
  {
    maxItems: maxItems = Number['POSITIVE_INFINITY'],
    maxCharacters: maxCharacters = Number['POSITIVE_INFINITY'],
  } = {},
) {
  const value41 = Number['isFinite'](Number(maxItems))
      ? Math['max'](0x0, Math['trunc'](Number(maxItems)))
      : Number['POSITIVE_INFINITY'],
    value42 = Number['isFinite'](Number(maxCharacters))
      ? Math['max'](0x0, Math['trunc'](Number(maxCharacters)))
      : Number['POSITIVE_INFINITY'];
  if (!Number['isFinite'](value41) && !Number['isFinite'](value42)) return list19;
  const map13 = new Map(
      (Array['isArray'](value40) ? value40 : [])['map']((value43) => [
        normalizeText(value43?.['ref']),
        normalizeText(value43?.['episodeRef']),
      ]),
    ),
    map14 = new Map();
  (list19['forEach']((value44) => {
    const text6 = normalizeText(value44['sourceSceneRefs']?.[0x0]),
      list20 = map14['get'](text6) || [];
    (list20['push'](value44), map14['set'](text6, list20));
  }),
    map14['forEach']((list21) =>
      list21['sort'](
        (error, error2) =>
          Number(error2['confidence'] || 0x0) - Number(error['confidence'] || 0x0) ||
          String(error2['evidence'] || '')['length'] - String(error['evidence'] || '')['length'] ||
          String(error['name'] || '')['localeCompare'](String(error2['name'] || ''), 'zh-CN'),
      ),
    ));
  const fairSourceRefOrder = createFairSourceRefOrder(value40, list19),
    list22 = [],
    map15 = new Set();
  let value45 = 0x2,
    value46 = !![];
  while (value46 && list22['length'] < value41) {
    value46 = ![];
    for (const value47 of fairSourceRefOrder) {
      const value48 = map14['get'](value47) || [],
        name3 = value48['shift']();
      if (!name3 || map15['has'](name3['key'])) continue;
      value46 = !![];
      const value49 = {
          kind: kind4,
          name: name3['name'],
          evidence: name3['evidence'],
          sourceSceneRefs: name3['sourceSceneRefs'],
          sourceChapterIds: normalizeStringArray(
            name3['sourceSceneRefs']['map']((value50) => map13['get'](value50)),
          ),
        },
        value51 = JSON['stringify'](value49)['length'] + (list22['length'] ? 0x1 : 0x0);
      if (value45 + value51 > value42) continue;
      (map15['add'](name3['key']), list22['push'](name3), (value45 += value51));
      if (list22['length'] >= value41) break;
    }
  }
  return list22;
}
function createEvidenceBuckets() {
  return { hardRequired: [], optionalCandidates: [], ignored: [] };
}
function getEvidenceBucketName(value52) {
  if (value52 === STORY_ASSET_REQUIREMENT_TIERS['hard']) return 'hardRequired';
  if (value52 === STORY_ASSET_REQUIREMENT_TIERS['optional']) return 'optionalCandidates';
  return 'ignored';
}
function getBoundedClausePrefix(list23, value53) {
  const list24 = list23['slice'](Math['max'](0x0, value53 - 0x60), value53);
  let value54 = -0x1;
  for (let count5 = list24['length'] - 0x1; count5 >= 0x0; count5 -= 0x1) {
    if (STORY_PROP_CLAUSE_BOUNDARY_PATTERN['test'](list24[count5])) {
      value54 = count5;
      break;
    }
  }
  return list24['slice'](value54 + 0x1);
}
function getBoundedClauseSuffix(list25, value55) {
  const list26 = list25['slice'](value55, Math['min'](list25['length'], value55 + 0x40));
  for (let value56 = 0x0; value56 < list26['length']; value56 += 0x1) {
    if (STORY_PROP_CLAUSE_BOUNDARY_PATTERN['test'](list26[value56])) return list26['slice'](0x0, value56);
  }
  return list26;
}
function getStoryTitleContext(list27, value57, value58) {
  return list27['slice'](Math['max'](0x0, value57 - 0x30), Math['min'](list27['length'], value58 + 0x40))[
    'trim'
  ]();
}
function isStructuralStoryTitle(list28, value59) {
  const value60 = list28['slice'](Math['max'](0x0, value59 - 0x40), value59);
  return STORY_STRUCTURAL_TITLE_PREFIX_PATTERN['test'](value60);
}
function hasHardStoryPropEvidence(list29, value61, value62) {
  const list30 = getBoundedClausePrefix(list29, value61),
    list31 = getBoundedClauseSuffix(list29, value62)['replace'](/^[\s，,:：]+/u, '');
  return (
    STORY_PROP_DECLARATION_PATTERN['test'](list29['slice'](Math['max'](0x0, value61 - 0x78), value61)) ||
    STORY_PROP_PHYSICAL_ACTION_PATTERN['test'](list30) ||
    STORY_PROP_PHYSICAL_ACTION_PATTERN['test'](list31['slice'](0x0, 0x20)) ||
    STORY_PROP_MATERIAL_CUE_PATTERN['test'](list30['slice'](-0x18)) ||
    STORY_PROP_MATERIAL_CUE_PATTERN['test'](list31['slice'](0x0, 0x18))
  );
}
function mergeEvidenceEntry(map16, error3) {
  const kind5 = normalizeText(error3?.['kind']),
    name4 = normalizeText(error3?.['name']),
    tier = normalizeText(error3?.['tier']);
  if (!kind5 || !name4 || !(tier in STORY_ASSET_REQUIREMENT_TIER_PRIORITY)) return;
  const value63 = kind5 + ':' + normalizeNameKey(name4),
    args6 = map16['get'](value63);
  if (!args6) {
    map16['set'](value63, {
      kind: kind5,
      name: name4,
      tier: tier,
      sourceSceneRefs: normalizeStringArray(error3?.['sourceSceneRefs']),
      hardSourceSceneRefs:
        tier === STORY_ASSET_REQUIREMENT_TIERS['hard']
          ? normalizeStringArray(error3?.['sourceSceneRefs'])
          : [],
      optionalSourceSceneRefs:
        tier === STORY_ASSET_REQUIREMENT_TIERS['optional']
          ? normalizeStringArray(error3?.['sourceSceneRefs'])
          : [],
      reasonCodes: normalizeStringArray(error3?.['reasonCodes']),
      contexts: normalizeStringArray(error3?.['contexts']),
    });
    return;
  }
  STORY_ASSET_REQUIREMENT_TIER_PRIORITY[tier] > STORY_ASSET_REQUIREMENT_TIER_PRIORITY[args6['tier']] &&
    (args6['tier'] = tier);
  args6['sourceSceneRefs'] = normalizeStringArray([
    ...args6['sourceSceneRefs'],
    ...(error3?.['sourceSceneRefs'] || []),
  ]);
  if (tier === STORY_ASSET_REQUIREMENT_TIERS['hard'])
    args6['hardSourceSceneRefs'] = normalizeStringArray([
      ...args6['hardSourceSceneRefs'],
      ...(error3?.['sourceSceneRefs'] || []),
    ]);
  else
    tier === STORY_ASSET_REQUIREMENT_TIERS['optional'] &&
      (args6['optionalSourceSceneRefs'] = normalizeStringArray([
        ...args6['optionalSourceSceneRefs'],
        ...(error3?.['sourceSceneRefs'] || []),
      ]));
  ((args6['reasonCodes'] = normalizeStringArray([
    ...args6['reasonCodes'],
    ...(error3?.['reasonCodes'] || []),
  ])),
    (args6['contexts'] = normalizeStringArray([...args6['contexts'], ...(error3?.['contexts'] || [])])[
      'slice'
    ](0x0, 0x3)));
}
export function createStoryAssetRequirementEvidencePlan(list32 = []) {
  const map17 = new Map();
  (Array['isArray'](list32) ? list32 : [])['forEach']((dom4) => {
    const text7 = normalizeText(dom4?.['ref']),
      name5 = normalizeText(dom4?.['assetHeading'] || dom4?.['heading']),
      tier2 = normalizeText(dom4?.['source']);
    name5 &&
      mergeEvidenceEntry(map17, {
        kind: 'scene',
        name: name5,
        tier:
          tier2 === 'upload-fallback'
            ? STORY_ASSET_REQUIREMENT_TIERS['optional']
            : STORY_ASSET_REQUIREMENT_TIERS['hard'],
        sourceSceneRefs: [text7],
        reasonCodes: [tier2 === 'upload-fallback' ? 'upload-fallback-heading' : 'structured-scene-heading'],
      });
    (normalizeStringArray(dom4?.['characters'])['forEach']((name6) => {
      mergeEvidenceEntry(map17, {
        kind: 'character',
        name: name6,
        tier:
          tier2 === 'upload-fallback'
            ? STORY_ASSET_REQUIREMENT_TIERS['optional']
            : STORY_ASSET_REQUIREMENT_TIERS['hard'],
        sourceSceneRefs: [text7],
        reasonCodes: [
          tier2 === 'upload-fallback' ? 'upload-fallback-imported-character' : 'structured-scene-character',
        ],
      });
    }),
      collectVerifiedLocalCandidates(dom4)['forEach'](({ kind: kind6, name: name7 }) => {
        mergeEvidenceEntry(map17, {
          kind: kind6,
          name: name7,
          tier: STORY_ASSET_REQUIREMENT_TIERS['optional'],
          sourceSceneRefs: [text7],
          reasonCodes: ['verified-local-entity-candidate'],
        });
      }));
    const text8 = normalizeText(dom4?.['body']);
    createStoryAssetActionPropCandidates([dom4])['forEach']((name8) => {
      mergeEvidenceEntry(map17, {
        kind: 'prop',
        name: name8['name'],
        tier: STORY_ASSET_REQUIREMENT_TIERS['hard'],
        sourceSceneRefs: name8['sourceSceneRefs'],
        reasonCodes: ['direct-object-physical-action'],
        contexts: [name8['evidence']],
      });
    });
    for (const value64 of text8['matchAll'](/《([^》\r\n]{1,48})》/gu)) {
      const name9 = normalizeText(value64[0x1]);
      if (!name9) continue;
      const value65 = Number(value64['index']) || 0x0,
        value66 = value65 + String(value64[0x0] || '')['length'],
        tier3 = isStructuralStoryTitle(text8, value65),
        value67 = !tier3 && hasHardStoryPropEvidence(text8, value65, value66);
      mergeEvidenceEntry(map17, {
        kind: 'prop',
        name: name9,
        tier: tier3
          ? STORY_ASSET_REQUIREMENT_TIERS['ignored']
          : value67
            ? STORY_ASSET_REQUIREMENT_TIERS['hard']
            : STORY_ASSET_REQUIREMENT_TIERS['optional'],
        sourceSceneRefs: [text7],
        reasonCodes: [
          tier3 ? 'structural-story-title' : value67 ? 'physical-prop-context' : 'quoted-title-candidate',
        ],
        contexts: [getStoryTitleContext(text8, value65, value66)],
      });
    }
  });
  const args7 = createEvidenceBuckets();
  return (
    [...map17['values']()]['forEach']((value68) => {
      args7[getEvidenceBucketName(value68['tier'])]['push'](value68);
    }),
    { schemaVersion: STORY_ASSET_REQUIREMENT_EVIDENCE_SCHEMA_VERSION, ...args7 }
  );
}
export function getHardRequiredStoryAssetNames(options3 = {}, value69 = '') {
  return normalizeStringArray(
    (Array['isArray'](options3?.['hardRequired']) ? options3['hardRequired'] : [])
      ['filter']((value70) => value70?.['kind'] === value69)
      ['map']((error4) => error4?.['name']),
  );
}
export function getHardRequiredStorySceneRefs(options4 = {}) {
  return normalizeStringArray(
    (Array['isArray'](options4?.['hardRequired']) ? options4['hardRequired'] : [])
      ['filter']((value71) => value71?.['kind'] === 'scene')
      ['flatMap']((value72) =>
        value72?.['hardSourceSceneRefs']?.['length']
          ? value72['hardSourceSceneRefs']
          : value72?.['sourceSceneRefs'] || [],
      ),
  );
}
export function getHardRequiredStoryAssetNamesForScene(options5 = {}, value73 = '', value74 = '') {
  const text9 = normalizeText(value74);
  if (!text9) return [];
  return normalizeStringArray(
    (Array['isArray'](options5?.['hardRequired']) ? options5['hardRequired'] : [])
      ['filter'](
        (value75) =>
          value75?.['kind'] === value73 &&
          (value75?.['hardSourceSceneRefs']?.['length']
            ? value75['hardSourceSceneRefs']['includes'](text9)
            : value75?.['sourceSceneRefs']?.['includes'](text9)),
      )
      ['map']((error5) => error5?.['name']),
  );
}
export function createStoryAssetOptionalCandidatesByKind(
  list33 = [],
  value76 = list33,
  {
    maxItemsPerKind: maxItemsPerKind = Number['POSITIVE_INFINITY'],
    maxCharactersPerKind: maxCharactersPerKind = Number['POSITIVE_INFINITY'],
    hardRequiredAssetNamesByKind: hardRequiredAssetNamesByKind = null,
  } = {},
) {
  const map18 = new Map(
      (Array['isArray'](value76) ? value76 : [])['map']((value77) => [
        normalizeText(value77?.['ref']),
        value77,
      ]),
    ),
    map19 = new Map(
      (Array['isArray'](value76) ? value76 : [])['map']((value78) => [
        normalizeText(value78?.['ref']),
        normalizeText(value78?.['episodeRef']),
      ]),
    ),
    value79 = ['character', 'scene', 'prop']['flatMap']((value80) =>
      (Array['isArray'](list33) ? list33 : [])['flatMap']((value81) =>
        collectVerifiedLocalCandidates(value81, map18['get'](normalizeText(value81?.['ref'])))
          ['filter']((value82) => value82['kind'] === value80)
          ['map']((error6) => ({
            ...error6,
            key: normalizeNameKey(error6['name']),
            sourceSceneRefs: normalizeStringArray([value81?.['ref']]),
          })),
      ),
    ),
    hardRequiredStoryAssetKindsByName = createHardRequiredStoryAssetKindsByName(
      value76,
      hardRequiredAssetNamesByKind,
    ),
    list34 = filterCandidatesByHardRequiredKinds(value79, hardRequiredStoryAssetKindsByName),
    map20 = resolveStoryAssetCandidateWinnerKindsByName(list34);
  return Object['fromEntries'](
    ['character', 'scene', 'prop']['map']((value83) => {
      const storyAssetOptionalCandidates = mergeStoryAssetOptionalCandidates(
          list34['filter']((event3) => event3['kind'] === value83 && map20['get'](event3['key']) === value83),
          list33,
        ),
        list35 = selectBudgetedStoryAssetOptionalCandidates(value83, storyAssetOptionalCandidates, list33, {
          maxItems: maxItemsPerKind,
          maxCharacters: maxCharactersPerKind,
        });
      return [
        value83,
        list35['map'](({ name: name10, evidence: evidence, sourceSceneRefs: sourceSceneRefs2 }) => ({
          name: name10,
          evidence: evidence,
          sourceSceneRefs: sourceSceneRefs2,
          sourceChapterIds: normalizeStringArray(sourceSceneRefs2['map']((value84) => map19['get'](value84))),
        })),
      ];
    }),
  );
}
export function createStoryAssetOptionalCandidateNamesByKind(list36 = [], value85 = list36) {
  const storyAssetOptionalCandidatesByKind = createStoryAssetOptionalCandidatesByKind(list36, value85);
  return Object['fromEntries'](
    ['character', 'scene', 'prop']['map']((value86) => [
      value86,
      normalizeStringArray(
        (storyAssetOptionalCandidatesByKind[value86] || [])['map']((error7) => error7['name']),
      ),
    ]),
  );
}
export function getUntrustedUploadFallbackStoryCharacterNames(
  options6 = {},
  value87 = [],
  value88 = value87,
) {
  const list37 = [
      ...(Array['isArray'](options6?.['hardRequired']) ? options6['hardRequired'] : []),
      ...(Array['isArray'](options6?.['optionalCandidates']) ? options6['optionalCandidates'] : []),
    ],
    map21 = new Set(
      createStoryAssetOptionalCandidateNamesByKind(value87, value88)['character']['map'](normalizeNameKey),
    );
  return (
    list37['filter'](
      (value89) =>
        value89?.['kind'] === 'character' &&
        value89?.['reasonCodes']?.['includes']('structured-scene-character'),
    )['forEach']((error8) => map21['add'](normalizeNameKey(error8?.['name']))),
    normalizeStringArray(
      list37['filter'](
        (error9) =>
          error9?.['kind'] === 'character' &&
          error9?.['reasonCodes']?.['includes']('upload-fallback-imported-character') &&
          !map21['has'](normalizeNameKey(error9?.['name'])),
      )['map']((error10) => error10?.['name']),
    )
  );
}
export function isNarrativeStoryCharacterFragment(value90 = '') {
  const args8 = normalizeText(value90);
  return [...args8]['length'] > 0x8 || STORY_CHARACTER_NARRATIVE_FRAGMENT_PATTERN['test'](args8);
}
