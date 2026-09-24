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
function normalizeText(_0x4f671a) {
  return typeof _0x4f671a === 'string' ? _0x4f671a['trim']() : '';
}
function normalizeNameKey(_0x13e954) {
  return normalizeText(_0x13e954)['normalize']('NFKC')['replace'](/\s+/gu, '')['toLocaleLowerCase']();
}
function normalizeStringArray(_0x3b9dda = []) {
  return [
    ...new Set((Array['isArray'](_0x3b9dda) ? _0x3b9dda : [])['map'](normalizeText)['filter'](Boolean)),
  ];
}
function getLocalCandidateConfidence(_0x27b409, _0xa610e6, _0x217fcf) {
  const _0x42c940 = (
    Array['isArray'](_0x27b409?.['localEntityEvidence']) ? _0x27b409['localEntityEvidence'] : []
  )
    ['filter'](
      (_0x2d1480) => _0x2d1480?.['kind'] === _0xa610e6 && normalizeText(_0x2d1480?.['text']) === _0x217fcf,
    )
    ['map']((_0x3abbc9) => Number(_0x3abbc9?.['probability']))
    ['filter'](Number['isFinite']);
  return _0x42c940['length'] ? Math['max'](..._0x42c940) : 0x0;
}
function stripLocalCandidateSummary(_0x5db535 = '') {
  return normalizeText(_0x5db535)
    ['replace'](/PP-UIE\s*本地候选：[^\r\n]*(?:\r?\n\s*证据原文：)?/giu, '')
    ['replace'](/证据原文：/gu, '')
    ['trim']();
}
function isUsableLocalCandidateName(_0x5ce8a3, _0x26c3ca) {
  const _0x2a4028 = normalizeText(_0x26c3ca),
    _0x1e0310 = [..._0x2a4028]['length'];
  if (
    _0x1e0310 < 0x2 ||
    _0x1e0310 > 0x30 ||
    /[\r\n]/u['test'](_0x2a4028) ||
    STORY_ASSET_LOCAL_CANDIDATE_PLACEHOLDER_PATTERN['test'](_0x2a4028)
  )
    return ![];
  if (_0x5ce8a3 === 'prop' && isNoisyStoryPropCandidateName(_0x2a4028)) return ![];
  if (_0x5ce8a3 !== 'character') return !![];
  return (
    _0x1e0310 <= 0x8 &&
    /^[\p{Script=Han}A-Za-z0-9·•._-]+$/u['test'](_0x2a4028) &&
    !STORY_CHARACTER_NARRATIVE_FRAGMENT_PATTERN['test'](_0x2a4028)
  );
}
function isNoisyStoryPropCandidateName(_0x202d5c = '') {
  const _0x551a50 = normalizeText(_0x202d5c)['replace'](STORY_PROP_LEADING_MEASURE_PATTERN, '')['trim']();
  if (
    [..._0x551a50]['length'] < 0x2 ||
    [..._0x551a50]['length'] > 0x18 ||
    STORY_PROP_CANDIDATE_NOISE_PATTERN['test'](_0x551a50) ||
    /(?:中段标记|场次标记|剧情标记|唯一标记|核对编号)$/u['test'](_0x551a50)
  )
    return !![];
  return !/^[\p{L}\p{N}·•._-]+$/u['test'](_0x551a50);
}
function normalizeStoryPropActionCandidate(_0x344bf4 = '') {
  let _0x43a1d9 = normalizeText(_0x344bf4)
    ['replace'](STORY_PROP_LEADING_MEASURE_PATTERN, '')
    ['replace'](/^(?:这|那|该)(?:个|只|把|张|本|册|枚|块|台|部|支|瓶|盒|箱|套|卷|件|份|根|条|沓)?/u, '')
    ['replace'](/^[《“”"'‘’]+|[》“”"'‘’]+$/gu, '')
    ['replace'](STORY_PROP_TRAILING_PREDICATE_PATTERN, '')
    ['trim']();
  for (let _0x17efa8 = 0x0; _0x17efa8 < 0x3; _0x17efa8 += 0x1) {
    const _0x56106b = _0x43a1d9;
    _0x43a1d9 = _0x43a1d9['replace'](STORY_PROP_TRAILING_ACTION_FRAGMENT_PATTERN, '')
      ['replace'](STORY_PROP_LEADING_STATE_PATTERN, '')
      ['trim']();
    if (_0x43a1d9 === _0x56106b) break;
  }
  const _0x5d04bd = normalizeText(
    _0x43a1d9['match'](STORY_PROP_PACKAGING_DESCRIPTION_PATTERN)?.[0x1] || _0x43a1d9,
  );
  if (
    !_0x5d04bd ||
    /[和及、]/u['test'](_0x5d04bd) ||
    STORY_PROP_NON_ASSET_FRAGMENT_PATTERN['test'](_0x5d04bd)
  )
    return '';
  return isNoisyStoryPropCandidateName(_0x5d04bd) ? '' : _0x5d04bd;
}
function createStoryPropActionEvidence(_0x10c275, _0x3a6d68, _0x40b6f3) {
  const _0x48117f = _0x10c275['indexOf'](_0x40b6f3, Math['max'](0x0, _0x3a6d68)),
    _0x34a862 = _0x48117f >= 0x0 ? _0x48117f : Math['max'](0x0, _0x3a6d68),
    _0x15a56b = Math['max'](0x0, _0x34a862 - 0x30);
  return _0x10c275['slice'](
    _0x15a56b,
    Math['min'](_0x10c275['length'], _0x15a56b + STORY_ASSET_OPTIONAL_CANDIDATE_EVIDENCE_CHARACTERS),
  )
    ['replace'](/\s+/gu, '\x20')
    ['trim']();
}
export function createStoryAssetActionPropCandidates(_0x4abdb9 = []) {
  const _0x20fa8c = new Map();
  return (
    (Array['isArray'](_0x4abdb9) ? _0x4abdb9 : [])['forEach']((_0x35d7c0) => {
      const _0x46e56b = normalizeText(_0x35d7c0?.['body']),
        _0x1ed120 = normalizeText(_0x35d7c0?.['ref']),
        _0x253986 = normalizeText(_0x35d7c0?.['episodeRef']);
      if (!_0x46e56b || !_0x1ed120) return;
      const _0x157400 = [
        ..._0x46e56b['matchAll'](STORY_PROP_DIRECT_OBJECT_ACTION_PATTERN),
        ..._0x46e56b['matchAll'](STORY_PROP_BA_ACTION_PATTERN),
      ]['sort'](
        (_0x1c2e7e, _0x5e2a59) => (Number(_0x1c2e7e['index']) || 0x0) - (Number(_0x5e2a59['index']) || 0x0),
      );
      _0x157400['forEach']((_0x1021a1) => {
        const _0x2707e2 = normalizeStoryPropActionCandidate(_0x1021a1[0x1]);
        if (!_0x2707e2) return;
        const _0x1b7011 = normalizeNameKey(_0x2707e2),
          _0x25c54c = _0x20fa8c['get'](_0x1b7011),
          _0x1d2928 = normalizeStringArray([...(_0x25c54c?.['sourceSceneRefs'] || []), _0x1ed120]),
          _0x1b8755 = normalizeStringArray([...(_0x25c54c?.['sourceChapterIds'] || []), _0x253986]);
        _0x20fa8c['set'](_0x1b7011, {
          name: _0x25c54c?.['name'] || _0x2707e2,
          evidence:
            _0x25c54c?.['evidence'] ||
            createStoryPropActionEvidence(_0x46e56b, Number(_0x1021a1['index']) || 0x0, _0x2707e2),
          sourceSceneRefs: _0x1d2928,
          sourceChapterIds: _0x1b8755,
          confidence: 0x1,
        });
      });
    }),
    [..._0x20fa8c['values']()]
  );
}
function createLocalCandidateEvidence(_0x6b0ac8, _0x5acf16, _0xad4e73, _0x3db80e) {
  const _0x5e736d = normalizeText(_0x5acf16?.['body']) || stripLocalCandidateSummary(_0x6b0ac8?.['body']),
    _0xf296b5 = (
      Array['isArray'](_0x6b0ac8?.['localEntityEvidence']) ? _0x6b0ac8['localEntityEvidence'] : []
    )['find'](
      (_0x2bfb85) => _0x2bfb85?.['kind'] === _0xad4e73 && normalizeText(_0x2bfb85?.['text']) === _0x3db80e,
    ),
    _0x519f53 = Math['max'](0x0, Math['trunc'](Number(_0xf296b5?.['start']) || 0x0)),
    _0x312682 =
      _0x5e736d['slice'](_0x519f53, _0x519f53 + _0x3db80e['length']) === _0x3db80e
        ? _0x519f53
        : _0x5e736d['indexOf'](_0x3db80e);
  if (_0x312682 < 0x0) return '';
  const _0x1c8529 = Math['max'](0x0, _0x312682 - 0x38);
  return _0x5e736d['slice'](
    _0x1c8529,
    Math['min'](_0x5e736d['length'], _0x1c8529 + STORY_ASSET_OPTIONAL_CANDIDATE_EVIDENCE_CHARACTERS),
  )
    ['replace'](/\s+/gu, '\x20')
    ['trim']();
}
function collectVerifiedLocalCandidates(_0x433372 = {}, _0x6e8e3b = null) {
  return ['character', 'scene', 'prop']['flatMap']((_0x42e7b9) =>
    normalizeStringArray(_0x433372?.['localEntityCandidates']?.[_0x42e7b9])
      ['filter']((_0x3b5384) => isUsableLocalCandidateName(_0x42e7b9, _0x3b5384))
      ['map']((_0x2e4c4b) => ({
        kind: _0x42e7b9,
        name: _0x2e4c4b,
        confidence: getLocalCandidateConfidence(_0x433372, _0x42e7b9, _0x2e4c4b),
        evidence: createLocalCandidateEvidence(_0x433372, _0x6e8e3b, _0x42e7b9, _0x2e4c4b),
      }))
      ['filter']((_0x566e9c) => _0x566e9c['evidence']),
  );
}
function resolveStoryAssetCandidateWinnerKindsByName(_0x8c874e = []) {
  const _0x1da2b5 = new Map();
  return (
    _0x8c874e['forEach'](({ key: _0x33af60, kind: _0x16df94, confidence: _0x349785 }) => {
      const _0x3939a6 = _0x1da2b5['get'](_0x33af60) || new Map();
      (_0x3939a6['set'](
        _0x16df94,
        Math['max'](Number(_0x3939a6['get'](_0x16df94)) || 0x0, Number(_0x349785) || 0x0),
      ),
        _0x1da2b5['set'](_0x33af60, _0x3939a6));
    }),
    new Map(
      [..._0x1da2b5]['flatMap'](([_0x17c6ae, _0x4f1832]) => {
        if (_0x4f1832['size'] === 0x1) return [[_0x17c6ae, [..._0x4f1832['keys']()][0x0]]];
        const _0x5e9513 = [..._0x4f1832]
            ['map'](([_0x34a491, _0x56ef81]) => ({ kind: _0x34a491, confidence: _0x56ef81 }))
            ['sort']((_0x4840cc, _0x30b108) => _0x30b108['confidence'] - _0x4840cc['confidence']),
          _0x1a274c = _0x5e9513[0x0],
          _0x585925 = _0x5e9513[0x1];
        if (
          _0x1a274c['confidence'] >= STORY_ASSET_CROSS_KIND_WINNER_MIN_CONFIDENCE &&
          _0x1a274c['confidence'] - _0x585925['confidence'] + Number['EPSILON'] >=
            STORY_ASSET_CROSS_KIND_WINNER_MIN_MARGIN
        )
          return [[_0x17c6ae, _0x1a274c['kind']]];
        return [];
      }),
    )
  );
}
function createHardRequiredStoryAssetKindsByName(_0x43265f = [], _0x5c46d5 = null) {
  const _0xbf33a0 = createStoryAssetRequirementEvidencePlan(_0x43265f),
    _0x228ed4 = new Map();
  return (
    ['character', 'scene', 'prop']['forEach']((_0x34c2d9) => {
      const _0x2b258e = normalizeStringArray([
        ...getHardRequiredStoryAssetNames(_0xbf33a0, _0x34c2d9),
        ...(Array['isArray'](_0x5c46d5?.[_0x34c2d9]) ? _0x5c46d5[_0x34c2d9] : []),
      ]);
      _0x2b258e['forEach']((_0x3a9175) => {
        const _0x566879 = normalizeNameKey(_0x3a9175),
          _0x16cd44 = _0x228ed4['get'](_0x566879) || new Set();
        (_0x16cd44['add'](_0x34c2d9), _0x228ed4['set'](_0x566879, _0x16cd44));
      });
    }),
    _0x228ed4
  );
}
function filterCandidatesByHardRequiredKinds(_0x46434e = [], _0x4d8b16 = new Map()) {
  return _0x46434e['filter']((_0x5972ee) => {
    const _0x848242 = _0x4d8b16['get'](_0x5972ee['key']);
    if (!_0x848242) return !![];
    return _0x848242['size'] === 0x1 && _0x848242['has'](_0x5972ee['kind']);
  });
}
function createAnchorFirstIndexOrder(_0x2cd5bd) {
  const _0x4b82ba = Math['max'](0x0, Math['trunc'](Number(_0x2cd5bd) || 0x0));
  if (!_0x4b82ba) return [];
  const _0x5acd55 = [],
    _0x557600 = new Set(),
    _0x28bc9c = (_0x229853) => {
      const _0x5e9ead = Math['max'](0x0, Math['min'](_0x4b82ba - 0x1, Math['trunc'](_0x229853)));
      if (_0x557600['has'](_0x5e9ead)) return;
      (_0x557600['add'](_0x5e9ead), _0x5acd55['push'](_0x5e9ead));
    };
  (_0x28bc9c(0x0), _0x28bc9c(Math['floor']((_0x4b82ba - 0x1) / 0x2)), _0x28bc9c(_0x4b82ba - 0x1));
  while (_0x5acd55['length'] < _0x4b82ba) {
    let _0x488a64 = -0x1,
      _0x1caf31 = -0x1;
    for (let _0x20abe8 = 0x0; _0x20abe8 < _0x4b82ba; _0x20abe8 += 0x1) {
      if (_0x557600['has'](_0x20abe8)) continue;
      const _0x56eb6e = Math['min'](..._0x5acd55['map']((_0x466841) => Math['abs'](_0x466841 - _0x20abe8)));
      _0x56eb6e > _0x1caf31 && ((_0x488a64 = _0x20abe8), (_0x1caf31 = _0x56eb6e));
    }
    _0x28bc9c(_0x488a64);
  }
  return _0x5acd55;
}
function createFairSourceRefOrder(_0x4bc031 = [], _0x2138cf = []) {
  const _0x13ac59 = new Set(_0x2138cf['flatMap']((_0x14964b) => _0x14964b['sourceSceneRefs'] || [])),
    _0x1f1ba5 = normalizeStringArray(
      (Array['isArray'](_0x4bc031) ? _0x4bc031 : [])
        ['map']((_0x1a9e7f) => _0x1a9e7f?.['ref'])
        ['filter']((_0x475dff) => _0x13ac59['has'](normalizeText(_0x475dff))),
    ),
    _0x417f0e = new Set(_0x1f1ba5);
  return (
    _0x2138cf['flatMap']((_0x5925fa) => _0x5925fa['sourceSceneRefs'] || [])['forEach']((_0x3d90c1) => {
      const _0x36b2e2 = normalizeText(_0x3d90c1);
      _0x36b2e2 &&
        !_0x417f0e['has'](_0x36b2e2) &&
        (_0x417f0e['add'](_0x36b2e2), _0x1f1ba5['push'](_0x36b2e2));
    }),
    createAnchorFirstIndexOrder(_0x1f1ba5['length'])['map']((_0x273fa4) => _0x1f1ba5[_0x273fa4])
  );
}
function selectFairSourceRefs(_0x4da786 = [], _0x15fd89 = [], _0x1801af = 0x3) {
  const _0x1911e4 = new Map(
      (Array['isArray'](_0x15fd89) ? _0x15fd89 : [])['map']((_0x3a4f54, _0x5cd8b2) => [
        normalizeText(_0x3a4f54?.['ref']),
        _0x5cd8b2,
      ]),
    ),
    _0x2fd175 = normalizeStringArray(_0x4da786)['sort'](
      (_0x260e41, _0x37315d) =>
        (_0x1911e4['get'](_0x260e41) ?? Number['MAX_SAFE_INTEGER']) -
        (_0x1911e4['get'](_0x37315d) ?? Number['MAX_SAFE_INTEGER']),
    );
  return createAnchorFirstIndexOrder(_0x2fd175['length'])
    ['slice'](0x0, Math['max'](0x1, Math['trunc'](Number(_0x1801af) || 0x0)))
    ['map']((_0x3763d8) => _0x2fd175[_0x3763d8]);
}
function mergeStoryAssetOptionalCandidates(_0x282514 = [], _0x55e239 = []) {
  const _0xe47394 = new Map();
  return (
    _0x282514['forEach']((_0x19966a) => {
      const _0x4b723d = _0xe47394['get'](_0x19966a['key']);
      if (!_0x4b723d) {
        _0xe47394['set'](_0x19966a['key'], {
          ..._0x19966a,
          sourceSceneRefs: normalizeStringArray(_0x19966a['sourceSceneRefs']),
        });
        return;
      }
      ((_0x4b723d['sourceSceneRefs'] = normalizeStringArray([
        ..._0x4b723d['sourceSceneRefs'],
        ...(_0x19966a['sourceSceneRefs'] || []),
      ])),
        (Number(_0x19966a['confidence']) > Number(_0x4b723d['confidence']) ||
          (Number(_0x19966a['confidence']) === Number(_0x4b723d['confidence']) &&
            String(_0x19966a['evidence'] || '')['length'] > String(_0x4b723d['evidence'] || '')['length'])) &&
          ((_0x4b723d['evidence'] = _0x19966a['evidence']),
          (_0x4b723d['confidence'] = _0x19966a['confidence'])));
    }),
    [..._0xe47394['values']()]['map']((_0x536da2) => ({
      ..._0x536da2,
      sourceSceneRefs: selectFairSourceRefs(_0x536da2['sourceSceneRefs'], _0x55e239, 0x3),
    }))
  );
}
function selectBudgetedStoryAssetOptionalCandidates(
  _0x393f35,
  _0x378385 = [],
  _0x16e2bf = [],
  {
    maxItems: maxItems = Number['POSITIVE_INFINITY'],
    maxCharacters: maxCharacters = Number['POSITIVE_INFINITY'],
  } = {},
) {
  const _0x1640f3 = Number['isFinite'](Number(maxItems))
      ? Math['max'](0x0, Math['trunc'](Number(maxItems)))
      : Number['POSITIVE_INFINITY'],
    _0x391637 = Number['isFinite'](Number(maxCharacters))
      ? Math['max'](0x0, Math['trunc'](Number(maxCharacters)))
      : Number['POSITIVE_INFINITY'];
  if (!Number['isFinite'](_0x1640f3) && !Number['isFinite'](_0x391637)) return _0x378385;
  const _0x4ce564 = new Map(
      (Array['isArray'](_0x16e2bf) ? _0x16e2bf : [])['map']((_0x2bc55f) => [
        normalizeText(_0x2bc55f?.['ref']),
        normalizeText(_0x2bc55f?.['episodeRef']),
      ]),
    ),
    _0x9e8d55 = new Map();
  (_0x378385['forEach']((_0x165cc8) => {
    const _0x14b27a = normalizeText(_0x165cc8['sourceSceneRefs']?.[0x0]),
      _0x16a1c0 = _0x9e8d55['get'](_0x14b27a) || [];
    (_0x16a1c0['push'](_0x165cc8), _0x9e8d55['set'](_0x14b27a, _0x16a1c0));
  }),
    _0x9e8d55['forEach']((_0x2d32fe) =>
      _0x2d32fe['sort'](
        (_0x4cb3d9, _0x50b98a) =>
          Number(_0x50b98a['confidence'] || 0x0) - Number(_0x4cb3d9['confidence'] || 0x0) ||
          String(_0x50b98a['evidence'] || '')['length'] - String(_0x4cb3d9['evidence'] || '')['length'] ||
          String(_0x4cb3d9['name'] || '')['localeCompare'](String(_0x50b98a['name'] || ''), 'zh-CN'),
      ),
    ));
  const _0x4e02b6 = createFairSourceRefOrder(_0x16e2bf, _0x378385),
    _0x51fb76 = [],
    _0x4faa91 = new Set();
  let _0x285f15 = 0x2,
    _0x4057a9 = !![];
  while (_0x4057a9 && _0x51fb76['length'] < _0x1640f3) {
    _0x4057a9 = ![];
    for (const _0xc38a18 of _0x4e02b6) {
      const _0x1517d5 = _0x9e8d55['get'](_0xc38a18) || [],
        _0x43e568 = _0x1517d5['shift']();
      if (!_0x43e568 || _0x4faa91['has'](_0x43e568['key'])) continue;
      _0x4057a9 = !![];
      const _0x83526b = {
          kind: _0x393f35,
          name: _0x43e568['name'],
          evidence: _0x43e568['evidence'],
          sourceSceneRefs: _0x43e568['sourceSceneRefs'],
          sourceChapterIds: normalizeStringArray(
            _0x43e568['sourceSceneRefs']['map']((_0x424735) => _0x4ce564['get'](_0x424735)),
          ),
        },
        _0xf9097 = JSON['stringify'](_0x83526b)['length'] + (_0x51fb76['length'] ? 0x1 : 0x0);
      if (_0x285f15 + _0xf9097 > _0x391637) continue;
      (_0x4faa91['add'](_0x43e568['key']), _0x51fb76['push'](_0x43e568), (_0x285f15 += _0xf9097));
      if (_0x51fb76['length'] >= _0x1640f3) break;
    }
  }
  return _0x51fb76;
}
function createEvidenceBuckets() {
  return { hardRequired: [], optionalCandidates: [], ignored: [] };
}
function getEvidenceBucketName(_0x13ab66) {
  if (_0x13ab66 === STORY_ASSET_REQUIREMENT_TIERS['hard']) return 'hardRequired';
  if (_0x13ab66 === STORY_ASSET_REQUIREMENT_TIERS['optional']) return 'optionalCandidates';
  return 'ignored';
}
function getBoundedClausePrefix(_0x338a37, _0x549620) {
  const _0x226ad0 = _0x338a37['slice'](Math['max'](0x0, _0x549620 - 0x60), _0x549620);
  let _0x2a3e33 = -0x1;
  for (let _0x1a1190 = _0x226ad0['length'] - 0x1; _0x1a1190 >= 0x0; _0x1a1190 -= 0x1) {
    if (STORY_PROP_CLAUSE_BOUNDARY_PATTERN['test'](_0x226ad0[_0x1a1190])) {
      _0x2a3e33 = _0x1a1190;
      break;
    }
  }
  return _0x226ad0['slice'](_0x2a3e33 + 0x1);
}
function getBoundedClauseSuffix(_0x4cfbc1, _0x2d9370) {
  const _0x552a81 = _0x4cfbc1['slice'](_0x2d9370, Math['min'](_0x4cfbc1['length'], _0x2d9370 + 0x40));
  for (let _0x250347 = 0x0; _0x250347 < _0x552a81['length']; _0x250347 += 0x1) {
    if (STORY_PROP_CLAUSE_BOUNDARY_PATTERN['test'](_0x552a81[_0x250347]))
      return _0x552a81['slice'](0x0, _0x250347);
  }
  return _0x552a81;
}
function getStoryTitleContext(_0x4c2cbf, _0x3fe1d4, _0x11a6f0) {
  return _0x4c2cbf['slice'](
    Math['max'](0x0, _0x3fe1d4 - 0x30),
    Math['min'](_0x4c2cbf['length'], _0x11a6f0 + 0x40),
  )['trim']();
}
function isStructuralStoryTitle(_0x17bc6e, _0x253092) {
  const _0x3b9b2f = _0x17bc6e['slice'](Math['max'](0x0, _0x253092 - 0x40), _0x253092);
  return STORY_STRUCTURAL_TITLE_PREFIX_PATTERN['test'](_0x3b9b2f);
}
function hasHardStoryPropEvidence(_0x22cb18, _0x693350, _0x3205fe) {
  const _0x2d84e6 = getBoundedClausePrefix(_0x22cb18, _0x693350),
    _0x21b2f3 = getBoundedClauseSuffix(_0x22cb18, _0x3205fe)['replace'](/^[\s，,:：]+/u, '');
  return (
    STORY_PROP_DECLARATION_PATTERN['test'](
      _0x22cb18['slice'](Math['max'](0x0, _0x693350 - 0x78), _0x693350),
    ) ||
    STORY_PROP_PHYSICAL_ACTION_PATTERN['test'](_0x2d84e6) ||
    STORY_PROP_PHYSICAL_ACTION_PATTERN['test'](_0x21b2f3['slice'](0x0, 0x20)) ||
    STORY_PROP_MATERIAL_CUE_PATTERN['test'](_0x2d84e6['slice'](-0x18)) ||
    STORY_PROP_MATERIAL_CUE_PATTERN['test'](_0x21b2f3['slice'](0x0, 0x18))
  );
}
function mergeEvidenceEntry(_0xf1ba03, _0x1b865c) {
  const _0x4426b6 = normalizeText(_0x1b865c?.['kind']),
    _0x5c62d0 = normalizeText(_0x1b865c?.['name']),
    _0x132694 = normalizeText(_0x1b865c?.['tier']);
  if (!_0x4426b6 || !_0x5c62d0 || !(_0x132694 in STORY_ASSET_REQUIREMENT_TIER_PRIORITY)) return;
  const _0x485ae9 = _0x4426b6 + ':' + normalizeNameKey(_0x5c62d0),
    _0x2b077d = _0xf1ba03['get'](_0x485ae9);
  if (!_0x2b077d) {
    _0xf1ba03['set'](_0x485ae9, {
      kind: _0x4426b6,
      name: _0x5c62d0,
      tier: _0x132694,
      sourceSceneRefs: normalizeStringArray(_0x1b865c?.['sourceSceneRefs']),
      hardSourceSceneRefs:
        _0x132694 === STORY_ASSET_REQUIREMENT_TIERS['hard']
          ? normalizeStringArray(_0x1b865c?.['sourceSceneRefs'])
          : [],
      optionalSourceSceneRefs:
        _0x132694 === STORY_ASSET_REQUIREMENT_TIERS['optional']
          ? normalizeStringArray(_0x1b865c?.['sourceSceneRefs'])
          : [],
      reasonCodes: normalizeStringArray(_0x1b865c?.['reasonCodes']),
      contexts: normalizeStringArray(_0x1b865c?.['contexts']),
    });
    return;
  }
  STORY_ASSET_REQUIREMENT_TIER_PRIORITY[_0x132694] >
    STORY_ASSET_REQUIREMENT_TIER_PRIORITY[_0x2b077d['tier']] && (_0x2b077d['tier'] = _0x132694);
  _0x2b077d['sourceSceneRefs'] = normalizeStringArray([
    ..._0x2b077d['sourceSceneRefs'],
    ...(_0x1b865c?.['sourceSceneRefs'] || []),
  ]);
  if (_0x132694 === STORY_ASSET_REQUIREMENT_TIERS['hard'])
    _0x2b077d['hardSourceSceneRefs'] = normalizeStringArray([
      ..._0x2b077d['hardSourceSceneRefs'],
      ...(_0x1b865c?.['sourceSceneRefs'] || []),
    ]);
  else
    _0x132694 === STORY_ASSET_REQUIREMENT_TIERS['optional'] &&
      (_0x2b077d['optionalSourceSceneRefs'] = normalizeStringArray([
        ..._0x2b077d['optionalSourceSceneRefs'],
        ...(_0x1b865c?.['sourceSceneRefs'] || []),
      ]));
  ((_0x2b077d['reasonCodes'] = normalizeStringArray([
    ..._0x2b077d['reasonCodes'],
    ...(_0x1b865c?.['reasonCodes'] || []),
  ])),
    (_0x2b077d['contexts'] = normalizeStringArray([
      ..._0x2b077d['contexts'],
      ...(_0x1b865c?.['contexts'] || []),
    ])['slice'](0x0, 0x3)));
}
export function createStoryAssetRequirementEvidencePlan(_0x3cd6e1 = []) {
  const _0x1a6801 = new Map();
  (Array['isArray'](_0x3cd6e1) ? _0x3cd6e1 : [])['forEach']((_0x16776c) => {
    const _0x2de33c = normalizeText(_0x16776c?.['ref']),
      _0x37e6db = normalizeText(_0x16776c?.['assetHeading'] || _0x16776c?.['heading']),
      _0x4ed9eb = normalizeText(_0x16776c?.['source']);
    _0x37e6db &&
      mergeEvidenceEntry(_0x1a6801, {
        kind: 'scene',
        name: _0x37e6db,
        tier:
          _0x4ed9eb === 'upload-fallback'
            ? STORY_ASSET_REQUIREMENT_TIERS['optional']
            : STORY_ASSET_REQUIREMENT_TIERS['hard'],
        sourceSceneRefs: [_0x2de33c],
        reasonCodes: [
          _0x4ed9eb === 'upload-fallback' ? 'upload-fallback-heading' : 'structured-scene-heading',
        ],
      });
    (normalizeStringArray(_0x16776c?.['characters'])['forEach']((_0x5743ed) => {
      mergeEvidenceEntry(_0x1a6801, {
        kind: 'character',
        name: _0x5743ed,
        tier:
          _0x4ed9eb === 'upload-fallback'
            ? STORY_ASSET_REQUIREMENT_TIERS['optional']
            : STORY_ASSET_REQUIREMENT_TIERS['hard'],
        sourceSceneRefs: [_0x2de33c],
        reasonCodes: [
          _0x4ed9eb === 'upload-fallback'
            ? 'upload-fallback-imported-character'
            : 'structured-scene-character',
        ],
      });
    }),
      collectVerifiedLocalCandidates(_0x16776c)['forEach'](({ kind: _0x562502, name: _0x1d9a4e }) => {
        mergeEvidenceEntry(_0x1a6801, {
          kind: _0x562502,
          name: _0x1d9a4e,
          tier: STORY_ASSET_REQUIREMENT_TIERS['optional'],
          sourceSceneRefs: [_0x2de33c],
          reasonCodes: ['verified-local-entity-candidate'],
        });
      }));
    const _0x34877d = normalizeText(_0x16776c?.['body']);
    createStoryAssetActionPropCandidates([_0x16776c])['forEach']((_0x116b8f) => {
      mergeEvidenceEntry(_0x1a6801, {
        kind: 'prop',
        name: _0x116b8f['name'],
        tier: STORY_ASSET_REQUIREMENT_TIERS['hard'],
        sourceSceneRefs: _0x116b8f['sourceSceneRefs'],
        reasonCodes: ['direct-object-physical-action'],
        contexts: [_0x116b8f['evidence']],
      });
    });
    for (const _0x26c36a of _0x34877d['matchAll'](/《([^》\r\n]{1,48})》/gu)) {
      const _0x1f5dfb = normalizeText(_0x26c36a[0x1]);
      if (!_0x1f5dfb) continue;
      const _0x2aae09 = Number(_0x26c36a['index']) || 0x0,
        _0x2cc8e3 = _0x2aae09 + String(_0x26c36a[0x0] || '')['length'],
        _0x1f8d39 = isStructuralStoryTitle(_0x34877d, _0x2aae09),
        _0x5061af = !_0x1f8d39 && hasHardStoryPropEvidence(_0x34877d, _0x2aae09, _0x2cc8e3);
      mergeEvidenceEntry(_0x1a6801, {
        kind: 'prop',
        name: _0x1f5dfb,
        tier: _0x1f8d39
          ? STORY_ASSET_REQUIREMENT_TIERS['ignored']
          : _0x5061af
            ? STORY_ASSET_REQUIREMENT_TIERS['hard']
            : STORY_ASSET_REQUIREMENT_TIERS['optional'],
        sourceSceneRefs: [_0x2de33c],
        reasonCodes: [
          _0x1f8d39
            ? 'structural-story-title'
            : _0x5061af
              ? 'physical-prop-context'
              : 'quoted-title-candidate',
        ],
        contexts: [getStoryTitleContext(_0x34877d, _0x2aae09, _0x2cc8e3)],
      });
    }
  });
  const _0x7b2330 = createEvidenceBuckets();
  return (
    [..._0x1a6801['values']()]['forEach']((_0x17bd80) => {
      _0x7b2330[getEvidenceBucketName(_0x17bd80['tier'])]['push'](_0x17bd80);
    }),
    { schemaVersion: STORY_ASSET_REQUIREMENT_EVIDENCE_SCHEMA_VERSION, ..._0x7b2330 }
  );
}
export function getHardRequiredStoryAssetNames(_0x44ed57 = {}, _0x3b3f24 = '') {
  return normalizeStringArray(
    (Array['isArray'](_0x44ed57?.['hardRequired']) ? _0x44ed57['hardRequired'] : [])
      ['filter']((_0x36f4d3) => _0x36f4d3?.['kind'] === _0x3b3f24)
      ['map']((_0x23f91b) => _0x23f91b?.['name']),
  );
}
export function getHardRequiredStorySceneRefs(_0x5ced23 = {}) {
  return normalizeStringArray(
    (Array['isArray'](_0x5ced23?.['hardRequired']) ? _0x5ced23['hardRequired'] : [])
      ['filter']((_0x5a6091) => _0x5a6091?.['kind'] === 'scene')
      ['flatMap']((_0x1ffd3b) =>
        _0x1ffd3b?.['hardSourceSceneRefs']?.['length']
          ? _0x1ffd3b['hardSourceSceneRefs']
          : _0x1ffd3b?.['sourceSceneRefs'] || [],
      ),
  );
}
export function getHardRequiredStoryAssetNamesForScene(_0x56036c = {}, _0xcee4b2 = '', _0x552eb4 = '') {
  const _0x404a89 = normalizeText(_0x552eb4);
  if (!_0x404a89) return [];
  return normalizeStringArray(
    (Array['isArray'](_0x56036c?.['hardRequired']) ? _0x56036c['hardRequired'] : [])
      ['filter'](
        (_0x446283) =>
          _0x446283?.['kind'] === _0xcee4b2 &&
          (_0x446283?.['hardSourceSceneRefs']?.['length']
            ? _0x446283['hardSourceSceneRefs']['includes'](_0x404a89)
            : _0x446283?.['sourceSceneRefs']?.['includes'](_0x404a89)),
      )
      ['map']((_0x3e4da3) => _0x3e4da3?.['name']),
  );
}
export function createStoryAssetOptionalCandidatesByKind(
  _0x53a9bc = [],
  _0xf4cc4b = _0x53a9bc,
  {
    maxItemsPerKind: maxItemsPerKind = Number['POSITIVE_INFINITY'],
    maxCharactersPerKind: maxCharactersPerKind = Number['POSITIVE_INFINITY'],
    hardRequiredAssetNamesByKind: hardRequiredAssetNamesByKind = null,
  } = {},
) {
  const _0x282b7c = new Map(
      (Array['isArray'](_0xf4cc4b) ? _0xf4cc4b : [])['map']((_0x3ae8dd) => [
        normalizeText(_0x3ae8dd?.['ref']),
        _0x3ae8dd,
      ]),
    ),
    _0xe3c38f = new Map(
      (Array['isArray'](_0xf4cc4b) ? _0xf4cc4b : [])['map']((_0x3c6e16) => [
        normalizeText(_0x3c6e16?.['ref']),
        normalizeText(_0x3c6e16?.['episodeRef']),
      ]),
    ),
    _0x3bb4bb = ['character', 'scene', 'prop']['flatMap']((_0x5a231a) =>
      (Array['isArray'](_0x53a9bc) ? _0x53a9bc : [])['flatMap']((_0x1a0740) =>
        collectVerifiedLocalCandidates(_0x1a0740, _0x282b7c['get'](normalizeText(_0x1a0740?.['ref'])))
          ['filter']((_0x399389) => _0x399389['kind'] === _0x5a231a)
          ['map']((_0x41ddc9) => ({
            ..._0x41ddc9,
            key: normalizeNameKey(_0x41ddc9['name']),
            sourceSceneRefs: normalizeStringArray([_0x1a0740?.['ref']]),
          })),
      ),
    ),
    _0x22d285 = createHardRequiredStoryAssetKindsByName(_0xf4cc4b, hardRequiredAssetNamesByKind),
    _0x528ef4 = filterCandidatesByHardRequiredKinds(_0x3bb4bb, _0x22d285),
    _0x23b46c = resolveStoryAssetCandidateWinnerKindsByName(_0x528ef4);
  return Object['fromEntries'](
    ['character', 'scene', 'prop']['map']((_0x22218d) => {
      const _0x2a25d7 = mergeStoryAssetOptionalCandidates(
          _0x528ef4['filter'](
            (_0x4ef10d) =>
              _0x4ef10d['kind'] === _0x22218d && _0x23b46c['get'](_0x4ef10d['key']) === _0x22218d,
          ),
          _0x53a9bc,
        ),
        _0x4b58d2 = selectBudgetedStoryAssetOptionalCandidates(_0x22218d, _0x2a25d7, _0x53a9bc, {
          maxItems: maxItemsPerKind,
          maxCharacters: maxCharactersPerKind,
        });
      return [
        _0x22218d,
        _0x4b58d2['map'](({ name: _0x24a47f, evidence: _0x3fa373, sourceSceneRefs: _0x5da2aa }) => ({
          name: _0x24a47f,
          evidence: _0x3fa373,
          sourceSceneRefs: _0x5da2aa,
          sourceChapterIds: normalizeStringArray(
            _0x5da2aa['map']((_0x4e3961) => _0xe3c38f['get'](_0x4e3961)),
          ),
        })),
      ];
    }),
  );
}
export function createStoryAssetOptionalCandidateNamesByKind(_0x14e213 = [], _0x42b45f = _0x14e213) {
  const _0x17dafc = createStoryAssetOptionalCandidatesByKind(_0x14e213, _0x42b45f);
  return Object['fromEntries'](
    ['character', 'scene', 'prop']['map']((_0x428273) => [
      _0x428273,
      normalizeStringArray((_0x17dafc[_0x428273] || [])['map']((_0x22f8e5) => _0x22f8e5['name'])),
    ]),
  );
}
export function getUntrustedUploadFallbackStoryCharacterNames(
  _0x43e07a = {},
  _0x1fb9cd = [],
  _0xeba98 = _0x1fb9cd,
) {
  const _0x579fa6 = [
      ...(Array['isArray'](_0x43e07a?.['hardRequired']) ? _0x43e07a['hardRequired'] : []),
      ...(Array['isArray'](_0x43e07a?.['optionalCandidates']) ? _0x43e07a['optionalCandidates'] : []),
    ],
    _0x497802 = new Set(
      createStoryAssetOptionalCandidateNamesByKind(_0x1fb9cd, _0xeba98)['character']['map'](normalizeNameKey),
    );
  return (
    _0x579fa6['filter'](
      (_0xe1fe6e) =>
        _0xe1fe6e?.['kind'] === 'character' &&
        _0xe1fe6e?.['reasonCodes']?.['includes']('structured-scene-character'),
    )['forEach']((_0x56220a) => _0x497802['add'](normalizeNameKey(_0x56220a?.['name']))),
    normalizeStringArray(
      _0x579fa6['filter'](
        (_0x5a6a67) =>
          _0x5a6a67?.['kind'] === 'character' &&
          _0x5a6a67?.['reasonCodes']?.['includes']('upload-fallback-imported-character') &&
          !_0x497802['has'](normalizeNameKey(_0x5a6a67?.['name'])),
      )['map']((_0x5781e8) => _0x5781e8?.['name']),
    )
  );
}
export function isNarrativeStoryCharacterFragment(_0x47131f = '') {
  const _0x552fa3 = normalizeText(_0x47131f);
  return [..._0x552fa3]['length'] > 0x8 || STORY_CHARACTER_NARRATIVE_FRAGMENT_PATTERN['test'](_0x552fa3);
}
