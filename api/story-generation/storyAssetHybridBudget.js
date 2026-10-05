import {
  getHardRequiredStoryAssetNamesForScene,
  getHardRequiredStorySceneRefs,
} from './storyAssetRequirementEvidence.js';
import { createStoryAssetPromptContracts } from './storyAssetExtractionRequest.js';
import { stripStoryAssetInternalEvidenceMetadata } from '../utils/storyAssetPublicText.js';
export const STORY_ASSET_EVIDENCE_BODY_MAX_CHARACTERS = 12000;
export const STORY_ASSET_CANDIDATE_MAX_ITEMS_PER_KIND = 64;
export const STORY_ASSET_CANDIDATE_MAX_CHARACTERS_PER_KIND = 8000;
export const STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS = 16384;
const STORY_ASSET_OUTPUT_BASE_TOKENS = 768,
  STORY_ASSET_OUTPUT_TOKENS_PER_REQUIRED = Object['freeze']({ character: 720, scene: 480, prop: 420 }),
  STORY_ASSET_VERBOSE_OUTPUT_SAFE_RATIO = 0.8,
  STORY_ASSET_VERBOSE_MAX_ITEMS_PER_KIND = 16,
  STORY_ASSET_COMPACT_OUTPUT_SAFE_RATIO = 0.8,
  STORY_ASSET_COMPACT_OUTPUT_BASE_TOKENS = 128,
  STORY_ASSET_COMPACT_OUTPUT_TOKENS_PER_ASSET = Object['freeze']({
    character: 768,
    scene: 576,
    prop: 512,
  });
function cloneValue(enabled) {
  if (!enabled || typeof enabled !== 'object') return enabled;
  try {
    return JSON['parse'](JSON['stringify'](enabled));
  } catch {
    return enabled;
  }
}
function normalizeText(value) {
  return typeof value === 'string' ? value['trim']() : '';
}
function selectFairStoryAssetCandidateSubset(list = [], item = 0) {
  const list2 = Array['isArray'](list) ? list : [],
    enabled2 = Math['max'](0, Math['trunc'](Number(item) || 0));
  if (list2['length'] <= enabled2) return list2;
  if (!enabled2) return [];
  const list3 = [],
    map = new Set(),
    handler = (key) => {
      const index = Math['max'](0, Math['min'](list2['length'] - 1, Math['trunc'](key)));
      if (map['has'](index) || list3['length'] >= enabled2) return;
      (map['add'](index), list3['push'](index));
    };
  (handler(0), handler(Math['floor']((list2['length'] - 1) / 2)), handler(list2['length'] - 1));
  while (list3['length'] < enabled2) {
    let result = -1,
      data = -1;
    for (let options = 0; options < list2['length']; options += 1) {
      if (map['has'](options)) continue;
      const target = Math['min'](...list3['map']((source) => Math['abs'](source - options)));
      target > data && ((result = options), (data = target));
    }
    handler(result);
  }
  return list3['map']((next) => list2[next]);
}
function selectFairCompactCandidatesWithinSerializedBudget(
  current,
  entry = [],
  record = Number['POSITIVE_INFINITY'],
  payload = STORY_ASSET_CANDIDATE_MAX_CHARACTERS_PER_KIND,
) {
  const list4 = Array['isArray'](entry) ? entry : [],
    handle = Number['isFinite'](Number(record))
      ? Math['max'](0, Math['min'](list4['length'], Math['trunc'](Number(record) || 0)))
      : list4['length'],
    state = Math['max'](0, Math['trunc'](Number(payload) || 0));
  for (let count = handle; count >= 0; count -= 1) {
    const fairStoryAssetCandidateSubset = selectFairStoryAssetCandidateSubset(list4, count),
      storyAssetPromptContracts = createStoryAssetPromptContracts(
        [current],
        null,
        { [current]: fairStoryAssetCandidateSubset },
        null,
        {
          includeClientKeys: !![],
        },
      )['payload'];
    if (JSON['stringify'](storyAssetPromptContracts['candidateAssets'] || [])['length'] <= state)
      return fairStoryAssetCandidateSubset;
  }
  return [];
}
function sampleTextAcrossValue(config = '', scope = 0) {
  const list5 = normalizeText(config),
    enabled3 = Math['max'](0, Math['trunc'](Number(scope) || 0));
  if (!enabled3 || !list5) return '';
  if (list5['length'] <= enabled3) return list5;
  if (enabled3 < 12) return list5['slice'](0, enabled3);
  const list6 = '\n…\n',
    input = enabled3 - list6['length'] * 2,
    output = Math['ceil'](input / 3),
    value2 = Math['floor'](input / 3),
    value3 = Math['max'](1, input - output - value2),
    value4 = Math['max'](output, Math['floor']((list5['length'] - value2) / 2));
  return [list5['slice'](0, output), list5['slice'](value4, value4 + value2), list5['slice'](-value3)]
    ['join'](list6)
    ['slice'](0, enabled3);
}
function allocateFairStoryEvidenceCharacters(list7 = [], value5 = 0) {
  const list8 = list7['map']((value6) => normalizeText(value6)['length']),
    value7 = list8['map'](() => 0);
  let count2 = Math['max'](0, Math['trunc'](Number(value5) || 0)),
    list9 = list8['map']((length, index2) => ({ index: index2, length: length }))['filter'](
      ({ length: length2 }) => length2 > 0,
    );
  while (count2 > 0 && list9['length']) {
    const value8 = Math['max'](1, Math['floor'](count2 / list9['length'])),
      list10 = [];
    for (const list11 of list9) {
      if (count2 <= 0) break;
      const value9 = list11['length'] - value7[list11['index']],
        value10 = Math['min'](value9, value8, count2);
      ((value7[list11['index']] += value10), (count2 -= value10));
      if (value7[list11['index']] < list11['length']) list10['push'](list11);
    }
    list9 = list10;
  }
  return value7;
}
export function createBudgetedStoryAssetEvidenceProject(
  options2 = {},
  value11 = [],
  {
    requirementEvidence: requirementEvidence = null,
    includeAllSceneHeadings: includeAllSceneHeadings = ![],
    includeAllSceneCharacters: includeAllSceneCharacters = ![],
    bodyCharacterBudget: bodyCharacterBudget = STORY_ASSET_EVIDENCE_BODY_MAX_CHARACTERS,
  } = {},
) {
  const list12 = Array['isArray'](value11) ? value11 : [],
    map2 = new Set(getHardRequiredStorySceneRefs(requirementEvidence || {})),
    value12 = list12['map']((dom) => stripStoryAssetInternalEvidenceMetadata(dom?.['body'])),
    allocateFairStoryEvidenceCharacters2 = allocateFairStoryEvidenceCharacters(value12, bodyCharacterBudget),
    map3 = new Map();
  list12['forEach']((value13, value14) => {
    map3['set'](
      normalizeText(value13?.['ref']),
      sampleTextAcrossValue(value12[value14], allocateFairStoryEvidenceCharacters2[value14]),
    );
  });
  const map4 = new Map();
  return (
    list12['forEach']((value15) => {
      const text = normalizeText(value15?.['episodeRef']);
      if (!text) return;
      const list13 = map4['get'](text) || [];
      (list13['push'](value15), map4['set'](text, list13));
    }),
    {
      ...cloneValue(options2),
      chapters: (Array['isArray'](options2?.['chapters']) ? options2['chapters'] : [])['map']((args) => {
        const content = map4['get'](normalizeText(args?.['id'])) || [];
        return {
          ...args,
          content: content['map']((value16) => {
            const text2 = normalizeText(value16?.['ref']),
              list14 = includeAllSceneCharacters
                ? Array['isArray'](value16?.['characters'])
                  ? value16['characters']
                  : []
                : getHardRequiredStoryAssetNamesForScene(requirementEvidence || {}, 'character', text2);
            return [
              includeAllSceneHeadings || map2['has'](text2)
                ? '场景：' + normalizeText(value16?.['heading'])
                : '',
              list14['length'] ? '已知出场角色：' + list14['join']('、') : '',
              map3['get'](text2) || '',
            ]
              ['filter'](Boolean)
              ['join']('\n');
          })['join']('\n\n'),
        };
      }),
    }
  );
}
function updateFingerprint(value17, value18) {
  const list15 = String(value18 ?? '');
  let value19 = value17 >>> 0;
  for (let value20 = 0; value20 < list15['length']; value20 += 1) {
    ((value19 ^= list15['charCodeAt'](value20)), (value19 = Math['imul'](value19, 0x1000193)));
  }
  return value19 >>> 0;
}
export function createStoryAssetAuthoritativeSourceFingerprint(list16 = []) {
  const list17 = Array['isArray'](list16) ? list16 : [];
  let updateFingerprint2 = 0x811c9dc5,
    value21 = 0;
  return (
    list17['forEach']((dom2) => {
      [
        dom2?.['ref'],
        dom2?.['episodeRef'],
        dom2?.['source'],
        dom2?.['heading'],
        ...(Array['isArray'](dom2?.['characters']) ? dom2['characters'] : []),
        dom2?.['body'],
      ]['forEach']((value22) => {
        const list18 = String(value22 ?? '');
        ((value21 += list18['length']),
          (updateFingerprint2 = updateFingerprint(updateFingerprint2, list18)),
          (updateFingerprint2 = updateFingerprint(updateFingerprint2, '\x00')));
      });
    }),
    'source-v1-' + list17['length'] + '-' + value21 + '-' + updateFingerprint2['toString'](16)
  );
}
export function estimateStoryAssetFocusedOutputTokens({
  kind: kind = '',
  requiredAssetCount: requiredAssetCount = 0,
  candidateAssetCount: candidateAssetCount = 0,
} = {}) {
  const value23 =
    STORY_ASSET_OUTPUT_TOKENS_PER_REQUIRED[kind] || STORY_ASSET_OUTPUT_TOKENS_PER_REQUIRED['scene'];
  return (
    STORY_ASSET_OUTPUT_BASE_TOKENS +
    Math['max'](0, Math['trunc'](Number(requiredAssetCount) || 0)) * value23 +
    Math['max'](0, Math['trunc'](Number(candidateAssetCount) || 0)) * value23
  );
}
export function estimateStoryAssetCompactOutputTokens({
  kind: kind = '',
  requiredAssetCount: requiredAssetCount = 0,
  candidateAssetCount: candidateAssetCount = 0,
} = {}) {
  const value24 =
    STORY_ASSET_COMPACT_OUTPUT_TOKENS_PER_ASSET[kind] || STORY_ASSET_COMPACT_OUTPUT_TOKENS_PER_ASSET['scene'];
  return (
    STORY_ASSET_COMPACT_OUTPUT_BASE_TOKENS +
    (Math['max'](0, Math['trunc'](Number(requiredAssetCount) || 0)) +
      Math['max'](0, Math['trunc'](Number(candidateAssetCount) || 0))) *
      value24
  );
}
export function resolveStoryAssetFocusedOutputMode({
  requiredAssetNamesByKind: requiredAssetNamesByKind = {},
  candidateAssetsByKind: candidateAssetsByKind = {},
  maxOutputTokens: maxOutputTokens = STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
} = {}) {
  const maxOutputTokens2 = Math['max'](1, Math['trunc'](Number(maxOutputTokens) || 0)),
    verboseSafeMaximum = Math['max'](
      1,
      Math['floor'](maxOutputTokens2 * STORY_ASSET_VERBOSE_OUTPUT_SAFE_RATIO),
    ),
    compactSafeMaximum = Math['max'](
      1,
      Math['floor'](maxOutputTokens2 * STORY_ASSET_COMPACT_OUTPUT_SAFE_RATIO),
    ),
    value25 = Object['fromEntries'](
      ['character', 'scene', 'prop']['map']((value26) => {
        const run = (value27) =>
            normalizeText(value27)
              ['normalize']('NFKC')
              ['replace'](/[^\p{L}\p{N}]+/gu, '')
              ['toLowerCase'](),
          map5 = new Set(
            (Array['isArray'](requiredAssetNamesByKind?.[value26]) ? requiredAssetNamesByKind[value26] : [])
              ['map'](run)
              ['filter'](Boolean),
          ),
          map6 = new Set(),
          value28 = (
            Array['isArray'](candidateAssetsByKind?.[value26]) ? candidateAssetsByKind[value26] : []
          )['filter']((error) => {
            const enabled4 = run(error && typeof error === 'object' ? error['name'] : error);
            if (!enabled4 || map5['has'](enabled4) || map6['has'](enabled4)) return ![];
            return (map6['add'](enabled4), !![]);
          });
        return [value26, value28];
      }),
    ),
    list19 = ['character', 'scene', 'prop']['map']((kind2) => {
      const requiredAssetCount2 = Array['isArray'](requiredAssetNamesByKind?.[kind2])
          ? requiredAssetNamesByKind[kind2]['length']
          : 0,
        candidateAssetCount2 = Array['isArray'](value25?.[kind2]) ? value25[kind2]['length'] : 0;
      return {
        kind: kind2,
        requiredAssetCount: requiredAssetCount2,
        candidateAssetCount: candidateAssetCount2,
        verboseOutputTokens: estimateStoryAssetFocusedOutputTokens({
          kind: kind2,
          requiredAssetCount: requiredAssetCount2,
          candidateAssetCount: candidateAssetCount2,
        }),
        compactOutputTokens: estimateStoryAssetCompactOutputTokens({
          kind: kind2,
          requiredAssetCount: requiredAssetCount2,
          candidateAssetCount: candidateAssetCount2,
        }),
      };
    }),
    candidateAssetsByKind2 = {},
    modeByKind = {},
    laneDetails = list19['map']((selectedCandidateAssetCount) => {
      const value29 =
        selectedCandidateAssetCount['requiredAssetCount'] +
        selectedCandidateAssetCount['candidateAssetCount'];
      if (
        value29 <= STORY_ASSET_VERBOSE_MAX_ITEMS_PER_KIND &&
        selectedCandidateAssetCount['verboseOutputTokens'] <= verboseSafeMaximum
      )
        return (
          (modeByKind[selectedCandidateAssetCount['kind']] = 'verbose'),
          (candidateAssetsByKind2[selectedCandidateAssetCount['kind']] =
            value25[selectedCandidateAssetCount['kind']]),
          {
            ...selectedCandidateAssetCount,
            mode: 'verbose',
            selectedCandidateAssetCount: selectedCandidateAssetCount['candidateAssetCount'],
          }
        );
      const value30 = STORY_ASSET_COMPACT_OUTPUT_TOKENS_PER_ASSET[selectedCandidateAssetCount['kind']],
        value31 = Math['max'](
          0,
          Math['floor']((compactSafeMaximum - STORY_ASSET_COMPACT_OUTPUT_BASE_TOKENS) / value30),
        ),
        value32 = Math['max'](0, value31 - selectedCandidateAssetCount['requiredAssetCount']);
      candidateAssetsByKind2[selectedCandidateAssetCount['kind']] =
        selectFairCompactCandidatesWithinSerializedBudget(
          selectedCandidateAssetCount['kind'],
          Array['isArray'](value25?.[selectedCandidateAssetCount['kind']])
            ? value25[selectedCandidateAssetCount['kind']]
            : [],
          value32,
        );
      const candidateAssetCount3 = candidateAssetsByKind2[selectedCandidateAssetCount['kind']]['length'],
        compactOutputTokens = estimateStoryAssetCompactOutputTokens({
          kind: selectedCandidateAssetCount['kind'],
          requiredAssetCount: selectedCandidateAssetCount['requiredAssetCount'],
          candidateAssetCount: candidateAssetCount3,
        });
      return (
        (modeByKind[selectedCandidateAssetCount['kind']] = 'compact'),
        {
          ...selectedCandidateAssetCount,
          mode: 'compact',
          selectedCandidateAssetCount: candidateAssetCount3,
          compactOutputTokens: compactOutputTokens,
        }
      );
    }),
    kind3 = laneDetails['find'](
      (value33) => value33['mode'] === 'compact' && value33['compactOutputTokens'] > compactSafeMaximum,
    );
  if (!kind3) {
    const mode = new Set(Object['values'](modeByKind));
    return {
      mode: mode['size'] === 1 ? [...mode][0] : 'mixed',
      modeByKind: modeByKind,
      candidateAssetsByKind: candidateAssetsByKind2,
      laneDetails: laneDetails,
      maxOutputTokens: maxOutputTokens2,
      verboseSafeMaximum: verboseSafeMaximum,
      verboseMaxItemsPerKind: STORY_ASSET_VERBOSE_MAX_ITEMS_PER_KIND,
      compactSafeMaximum: compactSafeMaximum,
    };
  }
  const error2 = new Error(
    kind3['kind'] +
      ' 资产即使使用紧凑输出仍预计需要 ' +
      (kind3['compactOutputTokens'] + ' tokens，超过单次输出容量 ') +
      (compactSafeMaximum + ' 的安全预算；已在调用 API 前安全停止。'),
  );
  ((error2['type'] = 'ASSET_OUTPUT_CAPACITY'),
    (error2['capacityDetails'] = {
      kind: kind3['kind'],
      requiredAssetCount: kind3['requiredAssetCount'],
      candidateAssetCount: kind3['candidateAssetCount'],
      estimatedOutputTokens: kind3['compactOutputTokens'],
      verboseEstimatedOutputTokens: kind3['verboseOutputTokens'],
      maxOutputTokens: maxOutputTokens2,
      compactSafeMaximum: compactSafeMaximum,
      attemptedMode: 'compact',
    }));
  throw error2;
}
export function assertStoryAssetFocusedOutputCapacity({
  requiredAssetNamesByKind: requiredAssetNamesByKind = {},
  candidateAssetsByKind: candidateAssetsByKind = {},
  maxOutputTokens: maxOutputTokens = STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
} = {}) {
  const maxOutputTokens3 = Math['max'](1, Math['trunc'](Number(maxOutputTokens) || 0));
  for (const kind4 of ['character', 'scene', 'prop']) {
    const requiredAssetCount3 = Array['isArray'](requiredAssetNamesByKind?.[kind4])
        ? requiredAssetNamesByKind[kind4]['length']
        : 0,
      candidateAssetCount4 = Array['isArray'](candidateAssetsByKind?.[kind4])
        ? candidateAssetsByKind[kind4]['length']
        : 0,
      estimatedOutputTokens = estimateStoryAssetFocusedOutputTokens({
        kind: kind4,
        requiredAssetCount: requiredAssetCount3,
        candidateAssetCount: candidateAssetCount4,
      });
    if (estimatedOutputTokens <= maxOutputTokens3) continue;
    const error3 = new Error(
      kind4 +
        ' 资产预计输出 ' +
        estimatedOutputTokens +
        ' tokens，超过单次输出容量 ' +
        maxOutputTokens3 +
        '；已在调用 API 前安全停止。',
    );
    ((error3['type'] = 'ASSET_OUTPUT_CAPACITY'),
      (error3['capacityDetails'] = {
        kind: kind4,
        requiredAssetCount: requiredAssetCount3,
        candidateAssetCount: candidateAssetCount4,
        estimatedOutputTokens: estimatedOutputTokens,
        maxOutputTokens: maxOutputTokens3,
      }));
    throw error3;
  }
}
