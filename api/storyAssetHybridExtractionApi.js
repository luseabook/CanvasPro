import {
  extractStoryAssetsEvidenceBatched,
  normalizeStoryAssetExtractionSources,
  splitDeterministicStorySceneAssetNames,
} from './storyAssetExperimentalApi.js';
import { extractStoryAssetsParallel } from './storyGenerationApi.js';
import { getStorySceneIdentityKey, normalizeStorySceneHeadingIdentity } from './utils/storySceneIdentity.js';
import {
  createStoryAssetActionPropCandidates,
  createStoryAssetOptionalCandidatesByKind,
  createStoryAssetRequirementEvidencePlan,
  getHardRequiredStoryAssetNames,
  getHardRequiredStoryAssetNamesForScene,
  getHardRequiredStorySceneRefs,
  getUntrustedUploadFallbackStoryCharacterNames,
  isNarrativeStoryCharacterFragment,
} from './story-generation/storyAssetRequirementEvidence.js';
import {
  createStoryAssetLocalEvidenceScenes,
  extractStoryAssetMentionsLocal,
} from './storyAssetLocalExtractionApi.js';
import {
  STORY_ASSET_CANDIDATE_MAX_CHARACTERS_PER_KIND,
  STORY_ASSET_CANDIDATE_MAX_ITEMS_PER_KIND,
  STORY_ASSET_EVIDENCE_BODY_MAX_CHARACTERS,
  STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
  createBudgetedStoryAssetEvidenceProject,
  createStoryAssetAuthoritativeSourceFingerprint,
  resolveStoryAssetFocusedOutputMode,
} from './story-generation/storyAssetHybridBudget.js';
import {
  createStoryAssetRequiredContractsByKind,
  lockStoryAssetRequiredSourceChapterIds,
} from './story-generation/storyAssetRequiredContracts.js';
import {
  STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION,
  createStoryAssetPromptContracts,
} from './story-generation/storyAssetExtractionRequest.js';
export {
  STORY_ASSET_CANDIDATE_MAX_CHARACTERS_PER_KIND,
  STORY_ASSET_CANDIDATE_MAX_ITEMS_PER_KIND,
  STORY_ASSET_EVIDENCE_BODY_MAX_CHARACTERS,
  STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
};
export const STORY_ASSET_DIRECT_API_MAX_SOURCE_CHARACTERS = 0x7d00;
const STORY_ASSET_CANDIDATE_INVENTORY_SCHEMA_VERSION = 0x1,
  STORY_ASSET_PUBLIC_PROMPT_MAX_CHARACTERS = 0x4b0,
  STORY_ASSET_SOURCE_COPY_WINDOW_CHARACTERS = 0x40,
  STORY_ASSET_HYBRID_QUALITY_POLICY_VERSION = 0x7,
  STORY_ASSET_QUALITY_REVIEW_SCHEMA_VERSION = 0x2,
  STORY_ASSET_QUALITY_RECOVERY_PAID_RERUN = 'paid-rerun-required',
  STORY_ASSET_PARALLEL_DRAFT_STRATEGY = 'kind-detailed-parallel-v1',
  STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY = 'evidence-batched-api-v2';
function cloneValue(enabled) {
  if (!enabled || typeof enabled !== 'object') return enabled;
  return JSON['parse'](JSON['stringify'](enabled));
}
function hasSameStoryAssetAuthoritativeContent(list, list2) {
  if (!Array['isArray'](list) || !Array['isArray'](list2)) return ![];
  if (list['length'] !== list2['length']) return ![];
  const list3 = ['ref', 'episodeRef', 'source', 'heading', 'body'];
  return list['every']((value, item) => {
    const key = list2[item];
    return list3['every']((index) => String(value?.[index] ?? '') === String(key?.[index] ?? ''));
  });
}
function createStoryAssetFocusedContractSnapshot(
  kind,
  {
    requiredAssetNamesByKind: requiredAssetNamesByKind,
    requiredAssetsByKind: requiredAssetsByKind,
    candidateAssetsByKind: candidateAssetsByKind,
    responseModeByKind: responseModeByKind,
  },
) {
  const includeClientKeys = responseModeByKind?.[kind] === 'compact' ? 'compact' : 'verbose',
    storyAssetPromptContracts = createStoryAssetPromptContracts(
      [kind],
      requiredAssetNamesByKind,
      candidateAssetsByKind,
      requiredAssetsByKind,
      {
        includeClientKeys: includeClientKeys === 'compact',
      },
    )['payload'];
  return {
    kind: kind,
    responseMode: includeClientKeys,
    responseSchemaVersion:
      includeClientKeys === 'compact' ? STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION : 0x1,
    requiredAssets: cloneValue(storyAssetPromptContracts['requiredAssets'] || []),
    candidateAssets: cloneValue(storyAssetPromptContracts['candidateAssets'] || []),
  };
}
function compareStoryAssetSceneHeadingContractRows(list4, list5) {
  if (!Array['isArray'](list4) || !Array['isArray'](list5)) return { compatible: ![], changed: ![] };
  if (list4['length'] !== list5['length']) return { compatible: ![], changed: ![] };
  let changed = ![];
  for (let result = 0x0; result < list4['length']; result += 0x1) {
    const error = list4[result],
      error2 = list5[result];
    if (JSON['stringify'](error) === JSON['stringify'](error2)) continue;
    const enabled2 = String(error?.['name'] || '')['trim'](),
      enabled3 = String(error2?.['name'] || '')['trim']();
    if (
      !enabled2 ||
      !enabled3 ||
      enabled2 === enabled3 ||
      normalizeStorySceneHeadingIdentity(enabled2) !== enabled3
    )
      return { compatible: ![], changed: ![] };
    const error3 = cloneValue(error),
      error4 = cloneValue(error2);
    (delete error3['name'], delete error3['clientKey'], delete error4['name'], delete error4['clientKey']);
    if (JSON['stringify'](error3) !== JSON['stringify'](error4)) return { compatible: ![], changed: ![] };
    changed = !![];
  }
  return { compatible: !![], changed: changed };
}
function areStoryAssetSceneHeadingContractSnapshotsCompatible(data, options) {
  const cloneValue2 = cloneValue(data),
    cloneValue3 = cloneValue(options);
  (delete cloneValue2['requiredAssets'],
    delete cloneValue2['candidateAssets'],
    delete cloneValue3['requiredAssets'],
    delete cloneValue3['candidateAssets']);
  if (JSON['stringify'](cloneValue2) !== JSON['stringify'](cloneValue3)) return ![];
  const compareStoryAssetSceneHeadingContractRows2 = compareStoryAssetSceneHeadingContractRows(
    data?.['requiredAssets'],
    options?.['requiredAssets'],
  );
  if (!compareStoryAssetSceneHeadingContractRows2['compatible']) return ![];
  const compareStoryAssetSceneHeadingContractRows3 = compareStoryAssetSceneHeadingContractRows(
    data?.['candidateAssets'],
    options?.['candidateAssets'],
  );
  return (
    compareStoryAssetSceneHeadingContractRows3['compatible'] &&
    (compareStoryAssetSceneHeadingContractRows2['changed'] ||
      compareStoryAssetSceneHeadingContractRows3['changed'])
  );
}
function getSavedStoryAssetRequiredNamesByKind(target) {
  const source = target?.['rawResponseContractSnapshotsByKind'] || {};
  return Object['fromEntries'](
    ['character', 'scene', 'prop']['map']((next) => [
      next,
      (Array['isArray'](source?.[next]?.['requiredAssets']) ? source[next]['requiredAssets'] : [])
        ['map']((error5) => String(error5?.['name'] || '')['trim']())
        ['filter'](Boolean),
    ]),
  );
}
function isStoryAssetSceneHeadingContractMigration({
  resumeDraft: resumeDraft2,
  requiredAssetNamesByKind: requiredAssetNamesByKind2,
  requiredAssetsByKind: requiredAssetsByKind2,
  candidateAssetsByKind: candidateAssetsByKind2,
  responseModeByKind: responseModeByKind2,
} = {}) {
  if (
    Number(resumeDraft2?.['hybridQualityPolicyVersion']) !== 0x6 ||
    resumeDraft2?.['strategy'] !== STORY_ASSET_PARALLEL_DRAFT_STRATEGY ||
    resumeDraft2?.['status'] !== 'completed' ||
    resumeDraft2?.['qualityReview']
  )
    return ![];
  const enabled4 = resumeDraft2?.['rawResponseContractSnapshotsByKind'];
  if (!enabled4 || typeof enabled4 !== 'object') return ![];
  const current = Object['fromEntries'](
    ['character', 'scene', 'prop']['map']((entry) => [
      entry,
      createStoryAssetFocusedContractSnapshot(entry, {
        requiredAssetNamesByKind: requiredAssetNamesByKind2,
        requiredAssetsByKind: requiredAssetsByKind2,
        candidateAssetsByKind: candidateAssetsByKind2,
        responseModeByKind: responseModeByKind2,
      }),
    ]),
  );
  if (
    JSON['stringify'](enabled4['character']) !== JSON['stringify'](current['character']) ||
    JSON['stringify'](enabled4['prop']) !== JSON['stringify'](current['prop'])
  )
    return ![];
  if (JSON['stringify'](enabled4['scene']) === JSON['stringify'](current['scene'])) return ![];
  return areStoryAssetSceneHeadingContractSnapshotsCompatible(enabled4['scene'], current['scene']);
}
function getStoryAssetPaidDraftKinds(record) {
  return ['character', 'scene', 'prop']['filter']((payload) => {
    const response = record?.['kindStates']?.[payload];
    return Boolean(
      record?.['paidResponseReceivedByKind']?.[payload] ||
      Object['hasOwn'](record?.['rawResponsesByKind'] || {}, payload) ||
      (Array['isArray'](record?.['assetsByKind']?.[payload]) && record['assetsByKind'][payload]['length']) ||
      Math['max'](0x0, Math['trunc'](Number(response?.['requestCount']) || 0x0)) > 0x0 ||
      [
        'running',
        'succeeded',
        'blocked-paid-response',
        'blocked-quality-rerun',
        'blocked-ambiguous-submission',
        'blocked-incompatible',
      ]['includes'](String(response?.['status'] || '')),
    );
  });
}
function isStoryAssetPaidLaneRerunAuthorized(handle, state) {
  return Boolean(
    handle?.['confirmed'] === !![] &&
    Array['isArray'](handle?.['authorizedKinds']) &&
    handle['authorizedKinds']['includes'](state),
  );
}
function getStoryAssetProtectedPaidBatchKeys(config) {
  const scope =
    config?.['batchSubmissionRecords'] && typeof config['batchSubmissionRecords'] === 'object'
      ? config['batchSubmissionRecords']
      : {};
  return Object['entries'](scope)['flatMap'](([input, response2]) => {
    const output = String(response2?.['status'] || '')['trim'](),
      value2 =
        output !== 'rejected-confirmed' &&
        (Math['max'](0x0, Math['trunc'](Number(response2?.['requestCount']) || 0x0)) > 0x0 ||
          Object['hasOwn'](response2 || {}, 'rawResponse') ||
          [
            'submitted',
            'ambiguous',
            'blocked-ambiguous-submission',
            'response-received',
            'blocked-paid-response',
            'blocked-quality-rerun',
            'blocked-incompatible',
            'validated',
          ]['includes'](output));
    return value2 ? [input] : [];
  });
}
function isStoryAssetPaidBatchRerunAuthorized(value3, value4) {
  return Boolean(
    value3?.['confirmed'] === !![] &&
    Array['isArray'](value3?.['authorizedBatchIds']) &&
    value3['authorizedBatchIds']['includes'](value4),
  );
}
function createStoryAssetSourceChangePaidHistoryEntry(
  responseMode,
  list6,
  previousSourceFingerprint,
  nextSourceFingerprint,
) {
  return {
    archivedAt: Date['now'](),
    reason: 'authorized-authoritative-source-change-rerun',
    previousSourceFingerprint: previousSourceFingerprint,
    nextSourceFingerprint: nextSourceFingerprint,
    lanes: Object['fromEntries'](
      list6['map']((value5) => [
        value5,
        {
          rawResponse: Object['hasOwn'](responseMode?.['rawResponsesByKind'] || {}, value5)
            ? responseMode['rawResponsesByKind'][value5]
            : '',
          responseMode: responseMode?.['rawResponseModesByKind']?.[value5] || '',
          contractSnapshot: cloneValue(responseMode?.['rawResponseContractSnapshotsByKind']?.[value5]),
          decisions: cloneValue(responseMode?.['decisionsByKind']?.[value5]),
          assets: cloneValue(responseMode?.['assetsByKind']?.[value5] || []),
          submissionState: cloneValue(responseMode?.['submissionStatesByKind']?.[value5]),
          kindState: cloneValue(responseMode?.['kindStates']?.[value5]),
        },
      ]),
    ),
  };
}
function createEmptyStoryAssetCandidatesByKind() {
  return { character: [], scene: [], prop: [] };
}
function mergeStoryAssetContractCandidates(args = [], args2 = []) {
  const map = new Map();
  return (
    [...args, ...args2]['forEach']((error6) => {
      const value6 = String(error6?.['name'] || '')['trim'](),
        storyAssetQualityName = normalizeStoryAssetQualityName(value6);
      if (!storyAssetQualityName) return;
      const args3 = map['get'](storyAssetQualityName);
      if (!args3) {
        map['set'](storyAssetQualityName, cloneValue(error6));
        return;
      }
      map['set'](storyAssetQualityName, {
        ...args3,
        sourceSceneRefs: [
          ...new Set(
            [
              ...(Array['isArray'](args3?.['sourceSceneRefs']) ? args3['sourceSceneRefs'] : []),
              ...(Array['isArray'](error6?.['sourceSceneRefs']) ? error6['sourceSceneRefs'] : []),
            ]
              ['map']((value7) => String(value7 || '')['trim']())
              ['filter'](Boolean),
          ),
        ],
        sourceChapterIds: [
          ...new Set(
            [
              ...(Array['isArray'](args3?.['sourceChapterIds']) ? args3['sourceChapterIds'] : []),
              ...(Array['isArray'](error6?.['sourceChapterIds']) ? error6['sourceChapterIds'] : []),
            ]
              ['map']((value8) => String(value8 || '')['trim']())
              ['filter'](Boolean),
          ),
        ],
        evidence: String(args3?.['evidence'] || error6?.['evidence'] || '')['trim'](),
      });
    }),
    [...map['values']()]
  );
}
function mergeStoryAssetActionPropCandidates(args4 = createEmptyStoryAssetCandidatesByKind(), value9 = []) {
  return {
    ...args4,
    prop: mergeStoryAssetContractCandidates(args4?.['prop'], createStoryAssetActionPropCandidates(value9)),
  };
}
function createStoryAssetCandidateInventory({
  status: status,
  evidenceScenes: evidenceScenes = [],
  localRuntime: localRuntime = null,
  sourceFingerprint: sourceFingerprint,
} = {}) {
  return {
    schemaVersion: STORY_ASSET_CANDIDATE_INVENTORY_SCHEMA_VERSION,
    status: status,
    evidenceScenes: cloneValue(Array['isArray'](evidenceScenes) ? evidenceScenes : []),
    localRuntime: localRuntime ? cloneValue(localRuntime) : null,
    sourceFingerprint: String(sourceFingerprint || ''),
  };
}
function getReusableStoryAssetCandidateInventory(value10, value11, list7 = []) {
  const response3 = value10?.['hybridCandidateInventory'],
    map2 = new Set([
      String(value11 || ''),
      ...(Array['isArray'](list7) ? list7['map']((value12) => String(value12 || '')) : []),
    ]);
  if (
    Number(response3?.['schemaVersion']) !== STORY_ASSET_CANDIDATE_INVENTORY_SCHEMA_VERSION ||
    !['ready', 'unavailable', 'disabled']['includes'](response3?.['status']) ||
    !Array['isArray'](response3?.['evidenceScenes']) ||
    !map2['has'](String(response3?.['sourceFingerprint'] || ''))
  )
    return null;
  return { ...cloneValue(response3), sourceFingerprint: String(value11 || '') };
}
function reportDiagnostics(value13, value14, level = {}) {
  try {
    const promise =
      typeof value13?.['info'] === 'function'
        ? value13['info'](value14, level)
        : value13?.['logEvent']?.({
            type:
              'story_asset.' +
              String(value14 || 'hybrid')
                ['replace'](/^story-asset-?/iu, '')
                ['replace'](/[^a-z0-9]+/giu, '_'),
            level: level?.['status'] === 'fallback' ? 'warn' : 'info',
            source: 'renderer',
            message: String(value14 || 'Story asset hybrid extraction event'),
            context: level,
          });
    promise &&
      typeof promise['then'] === 'function' &&
      void Promise['resolve'](promise)['catch'](() => undefined);
  } catch {}
}
function getStoryProjectChapterCharacters(options2 = {}) {
  return (Array['isArray'](options2?.['chapters']) ? options2['chapters'] : [])['reduce'](
    (value15, value16) => value15 + String(value16?.['content'] || '')['length'],
    0x0,
  );
}
function shouldUseDirectStoryAssetApi(options3 = {}, list8 = []) {
  const list9 = list8['filter']((value17) => value17?.['source'] === 'upload-fallback');
  if (list9['length']) {
    const list10 = list9['flatMap']((value18) =>
      Array['isArray'](value18?.['characters']) ? value18['characters'] : [],
    );
    if (!list10['some']((value19) => !isNarrativeStoryCharacterFragment(value19))) return ![];
  }
  const count = list8['reduce']((value20, dom) => value20 + String(dom?.['body'] || '')['length'], 0x0);
  return count > 0x0 && count <= STORY_ASSET_DIRECT_API_MAX_SOURCE_CHARACTERS;
}
function hasCompleteStructuredStorySceneEvidence(list11 = [], value21 = {}) {
  const list12 = Array['isArray'](list11) ? list11 : [];
  if (!list12['length']) return ![];
  const map3 = new Set(getHardRequiredStorySceneRefs(value21));
  return list12['every'](
    (value22) =>
      value22?.['source'] !== 'upload-fallback' && map3['has'](String(value22?.['ref'] || '')['trim']()),
  );
}
function createMissingLocalStoryAssetEvidenceError(cause = null) {
  return Object['assign'](
    new Error(
      '本地实体检索没有得到可验证证据，已在调用远程 API 前安全停止；请检查或重新下载 PP-UIE 组件后再试。',
    ),
    { type: 'LOCAL_ASSET_EVIDENCE_REQUIRED', cause: cause || undefined },
  );
}
function compactStoryAssetQualityText(value23 = '') {
  return String(value23 || '')['replace'](/\s+/gu, '');
}
function normalizeStoryAssetQualityName(value24 = '') {
  return String(value24 || '')
    ['normalize']('NFKC')
    ['replace'](/[（(][^（）()]{0,30}[）)]/gu, '')
    ['replace'](/[^\p{L}\p{N}]+/gu, '')
    ['toLowerCase']();
}
function createStoryCharacterQualityAliases(value25 = '') {
  const storyAssetQualityName2 = normalizeStoryAssetQualityName(value25);
  if (!storyAssetQualityName2) return [];
  const value26 = storyAssetQualityName2['replace'](
    /^(?:房东|编辑|医生|护士|警察|老师|老板|经理|店员|保安|司机|队长|主任|主管)/u,
    '',
  );
  return [...new Set([storyAssetQualityName2, value26]['filter'](Boolean))];
}
function storyCharacterQualityNamesMatch(value27 = '', value28 = '') {
  const list13 = createStoryCharacterQualityAliases(value27),
    list14 = createStoryCharacterQualityAliases(value28);
  return list13['some']((value29) => list14['includes'](value29));
}
function collectLegacyRequiredStoryCharacterNames(list15 = []) {
  const list16 = [];
  return (
    (Array['isArray'](list15) ? list15 : [])['forEach']((value30) => {
      (Array['isArray'](value30?.['characters']) ? value30['characters'] : [])['forEach']((value31) => {
        !list16['some']((value32) => storyCharacterQualityNamesMatch(value32, value31)) &&
          list16['push'](String(value31 || '')['trim']());
      });
    }),
    list16['filter'](Boolean)
  );
}
function collectStorySceneNamesFromHeadings(list17 = []) {
  const list18 = [];
  return (
    (Array['isArray'](list17) ? list17 : [])['forEach']((value33) => {
      splitDeterministicStorySceneAssetNames(value33)
        ['filter'](
          (value34) => value34 && !/^(?:(?:两个|多个|若干)?房间|室内|室外|同地|原地)$/u['test'](value34),
        )
        ['forEach']((value35) => {
          const storySceneIdentityKey = getStorySceneIdentityKey(value35);
          storySceneIdentityKey &&
            !list18['some']((value36) => getStorySceneIdentityKey(value36) === storySceneIdentityKey) &&
            list18['push'](value35);
        });
    }),
    list18
  );
}
function collectRequiredStorySceneNames(options4 = {}) {
  return collectStorySceneNamesFromHeadings(getHardRequiredStoryAssetNames(options4, 'scene'));
}
function collectLegacyRequiredStorySceneNames(list19 = []) {
  return collectStorySceneNamesFromHeadings(
    (Array['isArray'](list19) ? list19 : [])['map'](
      (value37) => value37?.['assetHeading'] || value37?.['heading'],
    ),
  );
}
function storySceneQualityNamesMatch(value38 = '', value39 = '') {
  const list20 = getStorySceneIdentityKey(value38),
    list21 = getStorySceneIdentityKey(value39);
  return Boolean(
    list20 && list21 && (list20 === list21 || list20['includes'](list21) || list21['includes'](list20)),
  );
}
function getStorySceneQualitySourceRefs(value40 = '', value41 = []) {
  return new Set(
    (Array['isArray'](value41) ? value41 : [])
      ['filter']((value42) =>
        splitDeterministicStorySceneAssetNames(value42?.['assetHeading'] || value42?.['heading'])['some'](
          (value43) => storySceneQualityNamesMatch(value43, value40),
        ),
      )
      ['map']((value44) => String(value44?.['ref'] || '')['trim']())
      ['filter'](Boolean),
  );
}
function storyPropQualityRequirementMatches(error7 = {}, value45 = '') {
  const args5 = normalizeStoryAssetQualityName(value45);
  if (!args5) return ![];
  if (normalizeStoryAssetQualityName(error7?.['name']) === args5) return !![];
  if ([...args5]['length'] < 0x3) return ![];
  const list22 = normalizeStoryAssetQualityName(
    [
      error7?.['scriptFacts'],
      error7?.['description'],
      ...(Array['isArray'](error7?.['appearances'])
        ? error7['appearances']['flatMap']((value46) => [value46?.['scriptFacts'], value46?.['description']])
        : []),
    ]
      ['filter'](Boolean)
      ['join']('\x20'),
  );
  return list22['includes'](args5);
}
function mergeStoryAssetCoverageText(list23 = []) {
  return [
    ...new Set(
      list23['flatMap']((value47) => String(value47 || '')['split'](/[、,，；;]+/u))
        ['map']((value48) => value48['trim']())
        ['filter'](Boolean),
    ),
  ]['join']('、');
}
function getStoryAssetVisualCompletenessScore(options5 = {}) {
  const list24 = Array['isArray'](options5?.['appearances']) ? options5['appearances'] : [];
  return list24['reduce'](
    (value49, value50) =>
      value49 +
      String(value50?.['prompt'] || '')['trim']()['length'] +
      String(value50?.['description'] || '')['trim']()['length'],
    String(options5?.['description'] || '')['trim']()['length'],
  );
}
export function consolidateDirectStorySceneAssets(args6 = {}, list25 = []) {
  const list26 = Array['isArray'](args6?.['assets']) ? args6['assets'] : [],
    map4 = new Map(),
    list27 = [];
  list26['forEach']((asset) => {
    if (asset?.['kind'] !== 'scene') {
      list27['push']({ type: 'asset', asset: asset });
      return;
    }
    const list28 = list25['filter']((value51) => storySceneQualityNamesMatch(asset?.['name'], value51)),
      value52 = list28['find'](
        (value53) => getStorySceneIdentityKey(value53) === getStorySceneIdentityKey(asset?.['name']),
      ),
      canonicalName =
        value52 || (list28['length'] === 0x1 ? list28[0x0] : String(asset?.['name'] || '')['trim']()),
      key2 = getStorySceneIdentityKey(canonicalName);
    (!map4['has'](key2) && (map4['set'](key2, []), list27['push']({ type: 'scene', key: key2 })),
      map4['get'](key2)['push']({ asset: asset, canonicalName: canonicalName }));
  });
  const assets = list27['flatMap']((event) => {
    if (event['type'] === 'asset') return [event['asset']];
    const list29 = map4['get'](event['key']) || [],
      name = [...list29]['sort'](
        (value54, value55) =>
          getStoryAssetVisualCompletenessScore(value55['asset']) -
          getStoryAssetVisualCompletenessScore(value54['asset']),
      )[0x0];
    if (!name) return [];
    const sourceChapterIds = [
        ...new Set(
          list29['flatMap'](({ asset: asset2 }) =>
            Array['isArray'](asset2?.['sourceChapterIds']) ? asset2['sourceChapterIds'] : [],
          ),
        ),
      ],
      map5 = new Map(),
      list30 = [];
    list29['forEach'](({ asset: asset3 }) => {
      (Array['isArray'](asset3?.['appearances']) ? asset3['appearances'] : [])['forEach']((error8) => {
        const value56 = String(error8?.['name'] || '')
            ['trim']()
            ['toLowerCase'](),
          value57 = value56 || 'appearance-' + (list30['length'] + 0x1);
        (!map5['has'](value57) && (map5['set'](value57, []), list30['push'](value57)),
          map5['get'](value57)['push'](error8));
      });
    });
    const appearances = list30['map']((value58) => {
      const list31 = map5['get'](value58) || [],
        args7 = [...list31]['sort'](
          (value59, value60) =>
            String(value60?.['prompt'] || '')['trim']()['length'] +
            String(value60?.['description'] || '')['trim']()['length'] -
            String(value59?.['prompt'] || '')['trim']()['length'] -
            String(value59?.['description'] || '')['trim']()['length'],
        )[0x0];
      return {
        ...args7,
        occurrences: mergeStoryAssetCoverageText(list31['map']((value61) => value61?.['occurrences'])),
        sourceChapterIds: [
          ...new Set(
            list31['flatMap']((value62) =>
              Array['isArray'](value62?.['sourceChapterIds']) ? value62['sourceChapterIds'] : [],
            ),
          ),
        ],
      };
    });
    return [
      {
        ...name['asset'],
        name: name['canonicalName'],
        occurrences: mergeStoryAssetCoverageText(
          list29['map'](({ asset: asset4 }) => asset4?.['occurrences']),
        ),
        sourceChapterIds: sourceChapterIds,
        appearances: appearances,
      },
    ];
  });
  return { ...args6, assets: assets };
}
function collectLegacyQuotedStoryProps(
  list32 = [],
  { includeEpisodeTitles: includeEpisodeTitles = ![] } = {},
) {
  const list33 = [];
  return (
    (Array['isArray'](list32) ? list32 : [])['forEach']((dom2) => {
      const list34 = String(dom2?.['body'] || '');
      for (const value63 of list34['matchAll'](/《([^》\r\n]{1,24})》/gu)) {
        const value64 = list34['slice'](
          Math['max'](0x0, (value63['index'] || 0x0) - 0x28),
          value63['index'] || 0x0,
        );
        if (
          !includeEpisodeTitles &&
          /(?:第\s*(?:\d+|[零〇一二三四五六七八九十百千万两廿卅]+)\s*集|(?:episode|ep)\s*\d+)\s*[：:—\-·丨|】\]）)]*\s*$/iu[
            'test'
          ](value64)
        )
          continue;
        const value65 = String(value63[0x1] || '')['trim']();
        if (value65 && !list33['includes'](value65)) list33['push'](value65);
      }
    }),
    list33
  );
}
function createStoryAssetQualityResumeRequirementAliases(enabled5, args8, value66) {
  if (!enabled5) return [];
  const count2 = Number(enabled5['hybridQualityPolicyVersion']) || 0x0;
  if (count2 >= STORY_ASSET_HYBRID_QUALITY_POLICY_VERSION) return [];
  const character = collectLegacyRequiredStoryCharacterNames(value66),
    args9 = { ...args8, character: character },
    args10 = {
      ...args9,
      scene: collectLegacyRequiredStorySceneNames(value66),
      prop: collectLegacyQuotedStoryProps(value66),
    },
    value67 = {
      ...args10,
      prop: collectLegacyQuotedStoryProps(value66, { includeEpisodeTitles: !![] }),
    },
    value68 = JSON['stringify'](args8),
    map6 = new Map();
  return (
    (count2 >= 0x3 ? [args9] : count2 >= 0x2 ? [args10] : [args10, value67])['forEach']((value69) => {
      const value70 = JSON['stringify'](value69);
      if (value70 !== value68 && !map6['has'](value70)) map6['set'](value70, value69);
    }),
    [...map6['values']()]
  );
}
function promptCopiesStorySource(value71 = '', list35 = []) {
  const list36 = compactStoryAssetQualityText(value71);
  if (list36['length'] < STORY_ASSET_SOURCE_COPY_WINDOW_CHARACTERS) return ![];
  return list35['some']((dom3) => {
    const list37 = compactStoryAssetQualityText(dom3?.['body']);
    if (list37['length'] < STORY_ASSET_SOURCE_COPY_WINDOW_CHARACTERS) return ![];
    for (
      let value72 = 0x0;
      value72 <= list37['length'] - STORY_ASSET_SOURCE_COPY_WINDOW_CHARACTERS;
      value72 += Math['floor'](STORY_ASSET_SOURCE_COPY_WINDOW_CHARACTERS / 0x2)
    ) {
      const value73 = list37['slice'](value72, value72 + STORY_ASSET_SOURCE_COPY_WINDOW_CHARACTERS);
      if (list36['includes'](value73)) return !![];
    }
    return ![];
  });
}
function removeNarrativeUploadFallbackCharacterAssets(
  args11 = {},
  value74 = {},
  value75 = [],
  value76 = value75,
  { requireVerifiedFallbackCharacters: requireVerifiedFallbackCharacters = ![] } = {},
) {
  const list38 = [
      ...(Array['isArray'](value74?.['hardRequired']) ? value74['hardRequired'] : []),
      ...(Array['isArray'](value74?.['optionalCandidates']) ? value74['optionalCandidates'] : []),
    ]['filter'](
      (value77) =>
        value77?.['kind'] === 'character' &&
        value77?.['reasonCodes']?.['includes']('upload-fallback-imported-character'),
    ),
    list39 = requireVerifiedFallbackCharacters
      ? getUntrustedUploadFallbackStoryCharacterNames(value74, value75, value76)
      : list38['filter']((error9) => isNarrativeStoryCharacterFragment(error9?.['name']))['map'](
          (error10) => error10?.['name'],
        ),
    map7 = new Set(list39['map'](normalizeStoryAssetQualityName)['filter'](Boolean));
  if (!map7['size']) return args11;
  return {
    ...args11,
    assets: (Array['isArray'](args11?.['assets']) ? args11['assets'] : [])['filter'](
      (error11) =>
        error11?.['kind'] !== 'character' || !map7['has'](normalizeStoryAssetQualityName(error11?.['name'])),
    ),
  };
}
function createHardAuthoritativeSourceScenes(list40 = [], value78 = {}) {
  return (Array['isArray'](list40) ? list40 : [])['map']((args12) => ({
    ...args12,
    characters: getHardRequiredStoryAssetNamesForScene(value78, 'character', args12?.['ref']),
  }));
}
export function assertStoryAssetPublicResultQuality(options6 = {}, value79 = [], value80 = {}) {
  const list41 = Array['isArray'](options6?.['assets']) ? options6['assets'] : [];
  if (!list41['length'])
    throw Object['assign'](new Error('API 没有返回可用资产；旧资产已保留，未进入下一步。'), {
      type: 'ASSET_VISUAL_RESULT_INCOMPLETE',
      validationDetails: { problems: ['API 没有返回可用资产'], kinds: ['character', 'scene', 'prop'] },
    });
  const problems = [],
    args13 = new Set(),
    handler = (value81, value82) => {
      problems['push'](value82);
      if (value81) args13['add'](value81);
    },
    list42 = list41['filter']((value83) => value83?.['kind'] === 'character'),
    list43 = list41['filter']((value84) => value84?.['kind'] === 'scene'),
    list44 = list41['filter']((value85) => value85?.['kind'] === 'prop'),
    value86 =
      /客户端|PP-UIE|证据原文|模型细化|统一添加|candidateAssets|本地候选|候选资产|召回候选|召回线索/iu,
    value87 =
      /^(?:(?:时间|时长|地点|目的地|状态|场景|镜头|画面|动作|音效|音乐|字幕|备注|人物|角色|台词|环境|转场)|(?:然后|随后|接着|紧接着|这时|此时)(?:他|她|它)?.*|.*(?:若干|数人|多人|等人))$/u,
    map8 = new Set();
  list42['forEach']((error12) => {
    const value88 = String(error12?.['name'] || '')['trim'](),
      storyAssetQualityName3 = normalizeStoryAssetQualityName(value88);
    storyAssetQualityName3 &&
      map8['has'](storyAssetQualityName3) &&
      handler('character', '重复角色“' + (value88 || '未命名角色') + '”');
    if (storyAssetQualityName3) map8['add'](storyAssetQualityName3);
    (isNarrativeStoryCharacterFragment(value88) || value87['test'](value88)) &&
      handler('character', '明显非人物角色“' + (value88 || '未命名角色') + '”');
  });
  const map9 = new Set();
  list44['forEach']((error13) => {
    const value89 = String(error13?.['name'] || '')['trim'](),
      storyAssetQualityName4 = normalizeStoryAssetQualityName(value89);
    storyAssetQualityName4 &&
      map9['has'](storyAssetQualityName4) &&
      handler('prop', '重复道具“' + (value89 || '未命名道具') + '”');
    if (storyAssetQualityName4) map9['add'](storyAssetQualityName4);
  });
  const map10 = new Set();
  (list43['forEach']((error14) => {
    const storySceneIdentityKey2 = getStorySceneIdentityKey(error14?.['name']);
    storySceneIdentityKey2 &&
      map10['has'](storySceneIdentityKey2) &&
      handler('scene', '重复场景“' + (error14?.['name'] || '未命名场景') + '”');
    if (storySceneIdentityKey2) map10['add'](storySceneIdentityKey2);
  }),
    (value80?.['character'] || [])['forEach']((value90) => {
      !list42['some']((error15) => storyCharacterQualityNamesMatch(error15?.['name'], value90)) &&
        handler('character', '缺少原文角色“' + value90 + '”');
    }));
  const map11 = new Map(),
    list45 = value80?.['scene'] || [],
    handler2 = (value91, map12) => {
      const value92 = list45[value91],
        map13 = getStorySceneQualitySourceRefs(value92, value79),
        value93 = list43['map']((asset5, assetIndex) => ({ asset: asset5, assetIndex: assetIndex }))
          ['filter'](
            ({ asset: asset6 }) =>
              storySceneQualityNamesMatch(asset6?.['name'], value92) ||
              (Array['isArray'](asset6?.['sourceSceneRefs']) &&
                asset6['sourceSceneRefs']['some']((value94) => map13['has'](value94))),
          )
          ['sort']((value95, value96) => {
            const storySceneIdentityKey3 =
                getStorySceneIdentityKey(value95['asset']?.['name']) === getStorySceneIdentityKey(value92),
              storySceneIdentityKey4 =
                getStorySceneIdentityKey(value96['asset']?.['name']) === getStorySceneIdentityKey(value92);
            return Number(storySceneIdentityKey4) - Number(storySceneIdentityKey3);
          })
          ['map'](({ assetIndex: assetIndex2 }) => assetIndex2);
      for (const value97 of value93) {
        if (map12['has'](value97)) continue;
        map12['add'](value97);
        const value98 = map11['get'](value97);
        if (value98 === undefined || handler2(value98, map12)) return (map11['set'](value97, value91), !![]);
      }
      return ![];
    };
  (list45['forEach']((value99, value100) => {
    !handler2(value100, new Set()) && handler('scene', '缺少原子场景“' + value99 + '”');
  }),
    (value80?.['prop'] || [])['forEach']((value101) => {
      !list44['some']((value102) => storyPropQualityRequirementMatches(value102, value101)) &&
        handler('prop', '缺少原文关键道具“' + value101 + '”');
    }),
    list41['forEach']((error16) => {
      [error16?.['name'], error16?.['description'], error16?.['voiceDescription'], error16?.['occurrences']][
        'forEach'
      ]((value103) => {
        value86['test'](String(value103 || '')) &&
          handler(error16?.['kind'], (error16?.['name'] || '未命名资产') + '描述泄露了内部处理规则');
      });
      error16?.['designStatus'] === 'baseline' &&
        handler(error16?.['kind'], (error16?.['name'] || '未命名资产') + '缺少\x20API\x20视觉反推');
      error16?.['kind'] === 'scene' &&
        /[/／|｜]/u['test'](String(error16?.['name'] || '')) &&
        handler('scene', error16['name'] + '仍是复合场景名');
      const list46 = Array['isArray'](error16?.['appearances']) ? error16['appearances'] : [];
      (!list46['length'] && handler(error16?.['kind'], (error16?.['name'] || '未命名资产') + '缺少形象'),
        list46['forEach']((error17) => {
          [error17?.['name'], error17?.['description'], error17?.['occurrences']]['forEach']((value104) => {
            value86['test'](String(value104 || '')) &&
              handler(error16?.['kind'], (error16?.['name'] || '未命名资产') + '形象描述泄露了内部处理规则');
          });
          const list47 = String(error17?.['prompt'] || '')['trim']();
          if (!list47) handler(error16?.['kind'], (error16?.['name'] || '未命名资产') + '缺少图片提示词');
          else {
            if (list47['length'] > STORY_ASSET_PUBLIC_PROMPT_MAX_CHARACTERS)
              handler(error16?.['kind'], (error16?.['name'] || '未命名资产') + '提示词异常过长');
            else {
              if (promptCopiesStorySource(list47, value79))
                handler(error16?.['kind'], (error16?.['name'] || '未命名资产') + '提示词复制了大段剧情原文');
              else
                value86['test'](list47) &&
                  handler(
                    error16?.['kind'],
                    (error16?.['name'] || '未命名资产') + '提示词泄露了内部处理规则',
                  );
            }
          }
        }));
    }));
  if (!problems['length']) return;
  const error18 = new Error(
    'API 视觉反推质量校验未通过：' +
      problems['slice'](0x0, 0x3)['join']('；') +
      '。旧资产已保留，未进入下一步。',
  );
  ((error18['type'] = 'ASSET_VISUAL_QUALITY'),
    (error18['validationDetails'] = { problems: problems, kinds: [...args13] }));
  throw error18;
}
async function checkpointStoryAssetQualityFailure(error19, enabled6, value105) {
  if (!enabled6 || typeof enabled6 !== 'object') return;
  const response4 = cloneValue(enabled6);
  response4['hybridQualityPolicyVersion'] = STORY_ASSET_HYBRID_QUALITY_POLICY_VERSION;
  const list48 = Array['isArray'](error19?.['validationDetails']?.['kinds'])
      ? error19['validationDetails']['kinds']
      : [],
    kinds = list48['length'] ? list48 : ['character', 'scene', 'prop'],
    batchIds =
      response4['strategy'] === STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY
        ? getStoryAssetProtectedPaidBatchKeys(response4)
        : [];
  ((response4['qualityReview'] = {
    schemaVersion: STORY_ASSET_QUALITY_REVIEW_SCHEMA_VERSION,
    status: 'blocked',
    policyVersion: STORY_ASSET_HYBRID_QUALITY_POLICY_VERSION,
    recoveryMode: STORY_ASSET_QUALITY_RECOVERY_PAID_RERUN,
    kinds: kinds,
    ...(batchIds['length'] ? { batchIds: batchIds } : {}),
    problems: Array['isArray'](error19?.['validationDetails']?.['problems'])
      ? [...error19['validationDetails']['problems']]
      : [],
    message: String(error19?.['message'] || '结果校验失败'),
    reviewedAt: Date['now'](),
  }),
    (response4['status'] = 'blocked'),
    (response4['kindStates'] =
      response4['kindStates'] && typeof response4['kindStates'] === 'object' ? response4['kindStates'] : {}),
    kinds['forEach']((kind2) => {
      response4['kindStates'][kind2] = {
        ...(response4['kindStates'][kind2] || {}),
        kind: kind2,
        status: 'blocked-quality-rerun',
        errorType: 'quality-rerun-required',
        errorMessage: '已付费结果未通过当前视觉质量合同；需要用户明确授权后重新请求该通道。',
        finishedAt: Date['now'](),
      };
    }),
    batchIds['forEach']((value106) => {
      const response5 = response4['batchSubmissionRecords']?.[value106];
      if (!response5) return;
      ((response5['qualityPreviousStatus'] = response5['status']),
        (response5['status'] = 'blocked-quality-rerun'),
        (response5['errorType'] = 'quality-rerun-required'),
        (response5['errorMessage'] = '已付费结果未通过当前视觉质量合同；需要用户逐批明确授权后重新请求。'),
        (response5['blockedAt'] = Date['now']()));
    }),
    (response4['completedKinds'] = ['character', 'scene', 'prop']['filter'](
      (value107) => response4['kindStates']?.[value107]?.['status'] === 'succeeded',
    )),
    (response4['failures'] = kinds['map']((kind3) => ({
      stage: 'quality',
      kind: kind3,
      errorType: 'quality-rerun-required',
      errorMessage: '已付费结果未通过当前视觉质量合同；需要用户明确授权后重新请求。',
    }))),
    (response4['updatedAt'] = Date['now']()),
    (error19['assetExtractionDraft'] = cloneValue(response4)),
    await value105?.(response4));
}
function prepareLegacyStoryAssetQualityRevalidationDraft(value108) {
  const response6 = cloneValue(value108);
  if (!response6) return value108;
  let enabled7 = ![];
  response6['qualityReview'] && (delete response6['qualityReview'], (enabled7 = !![]));
  let enabled8 = 0x0;
  ['character', 'scene', 'prop']['forEach']((value109) => {
    const response7 = response6?.['kindStates']?.[value109],
      assetCount = response6?.['assetsByKind']?.[value109],
      assetCount2 = Array['isArray'](response6?.['completedAssets'])
        ? response6['completedAssets']['filter']((value110) => value110?.['kind'] === value109)
        : [];
    if (
      response6?.['strategy'] === STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY &&
      response7?.['status'] === 'blocked-quality-rerun' &&
      assetCount2['length']
    ) {
      ((response6['kindStates'][value109] = {
        ...response7,
        status: 'succeeded',
        assetCount: assetCount2['length'],
        totalAssetCount: assetCount2['length'],
        errorType: '',
        errorMessage: '',
      }),
        (enabled8 += 0x1));
      return;
    }
    if (
      response7?.['status'] !== 'failed' ||
      response7?.['errorType'] !== 'validation' ||
      !Array['isArray'](assetCount)
    )
      return;
    ((response6['kindStates'][value109] = {
      ...response7,
      status: 'succeeded',
      assetCount: assetCount['length'],
      errorType: '',
      errorMessage: '',
    }),
      (enabled8 += 0x1));
  });
  if (!enabled8 && !enabled7) return value108;
  return (
    (response6['hybridQualityPolicyVersion'] = STORY_ASSET_HYBRID_QUALITY_POLICY_VERSION),
    (response6['completedKinds'] = ['character', 'scene', 'prop']['filter'](
      (value111) => response6['kindStates']?.[value111]?.['status'] === 'succeeded',
    )),
    response6?.['strategy'] === STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY
      ? Object['values'](response6['batchSubmissionRecords'] || {})['forEach']((response8) => {
          response8?.['status'] === 'blocked-quality-rerun' &&
            String(response8?.['qualityPreviousStatus'] || '')['trim']() &&
            ((response8['status'] = response8['qualityPreviousStatus']),
            delete response8['qualityPreviousStatus'],
            delete response8['errorType'],
            delete response8['errorMessage'],
            delete response8['blockedAt']);
        })
      : (response6['completedAssets'] = ['character', 'scene', 'prop']['flatMap'](
          (value112) => response6['assetsByKind']?.[value112] || [],
        )),
    (response6['failures'] = []),
    (response6['status'] = response6['completedKinds']['length'] === 0x3 ? 'completed' : 'partial'),
    response6
  );
}
function isCurrentStoryAssetPaidQualityReview(value113) {
  return Boolean(
    Number(value113?.['qualityReview']?.['schemaVersion']) >= STORY_ASSET_QUALITY_REVIEW_SCHEMA_VERSION &&
    Number(value113?.['qualityReview']?.['policyVersion']) === STORY_ASSET_HYBRID_QUALITY_POLICY_VERSION &&
    value113?.['qualityReview']?.['recoveryMode'] === STORY_ASSET_QUALITY_RECOVERY_PAID_RERUN,
  );
}
function archiveAndResetStoryAssetQualityLane(responseMode2, kind4) {
  responseMode2['paidResponseHistoryByKind'] =
    responseMode2['paidResponseHistoryByKind'] &&
    typeof responseMode2['paidResponseHistoryByKind'] === 'object'
      ? responseMode2['paidResponseHistoryByKind']
      : {};
  const list49 = Array['isArray'](responseMode2['paidResponseHistoryByKind'][kind4])
    ? responseMode2['paidResponseHistoryByKind'][kind4]
    : [];
  (list49['push']({
    archivedAt: Date['now'](),
    reason: 'authorized-quality-rerun',
    rawResponse: Object['hasOwn'](responseMode2?.['rawResponsesByKind'] || {}, kind4)
      ? responseMode2['rawResponsesByKind'][kind4]
      : '',
    responseMode: responseMode2?.['rawResponseModesByKind']?.[kind4] || '',
    contractSnapshot: cloneValue(responseMode2?.['rawResponseContractSnapshotsByKind']?.[kind4]),
    decisions: cloneValue(responseMode2?.['decisionsByKind']?.[kind4]),
    assets: cloneValue(responseMode2?.['assetsByKind']?.[kind4] || []),
    submissionState: cloneValue(responseMode2?.['submissionStatesByKind']?.[kind4]),
    kindState: cloneValue(responseMode2?.['kindStates']?.[kind4]),
  }),
    (responseMode2['paidResponseHistoryByKind'][kind4] = list49),
    (responseMode2['assetsByKind'][kind4] = []),
    delete responseMode2['rawResponsesByKind'][kind4],
    delete responseMode2['rawResponseModesByKind'][kind4],
    delete responseMode2['rawResponseContractSnapshotsByKind'][kind4],
    delete responseMode2['paidResponseReceivedByKind'][kind4],
    delete responseMode2['decisionsByKind'][kind4],
    delete responseMode2['submissionStatesByKind'][kind4],
    (responseMode2['kindStates'][kind4] = {
      ...(responseMode2['kindStates'][kind4] || {}),
      kind: kind4,
      status: 'pending',
      assetCount: 0x0,
      errorType: '',
      errorMessage: '',
      finishedAt: 0x0,
    }));
}
function archiveAndResetStoryAssetQualityBatches(response9, list50) {
  ((response9['paidBatchHistory'] =
    response9['paidBatchHistory'] && typeof response9['paidBatchHistory'] === 'object'
      ? response9['paidBatchHistory']
      : {}),
    list50['forEach']((value114) => {
      const enabled9 = response9['batchSubmissionRecords']?.[value114];
      if (!enabled9) return;
      const list51 = Array['isArray'](response9['paidBatchHistory'][value114])
        ? response9['paidBatchHistory'][value114]
        : [];
      (list51['push']({
        ...cloneValue(enabled9),
        archivedAt: Date['now'](),
        archiveReason: 'authorized-quality-rerun',
      }),
        (response9['paidBatchHistory'][value114] = list51));
    }),
    (response9['status'] = 'pending'),
    (response9['phase'] = 'inventory'),
    (response9['inventoryBatches'] = []),
    (response9['inventory'] = null),
    (response9['completedAssets'] = []),
    (response9['detailBatches'] = []),
    (response9['batchSubmissionRecords'] = {}),
    (response9['failures'] = []),
    (response9['runRequestCount'] = 0x0),
    delete response9['kindStates'],
    delete response9['progress']);
}
function createStoryAssetQualityRerunRequiredError(value115, args14, args15) {
  const error20 = new Error('已付费结果未通过视觉质量合同；未获得精确授权，未自动重新请求。');
  return (
    (error20['type'] = 'ASSET_VISUAL_QUALITY_RERUN_REQUIRED'),
    (error20['blockedKinds'] = [...args14]),
    (error20['blockedBatchIds'] = [...args15]),
    (error20['assetExtractionDraft'] = cloneValue(value115)),
    error20
  );
}
async function prepareStoryAssetQualityRecoveryDraft(enabled10, value116, value117) {
  if (!enabled10?.['qualityReview']) return enabled10;
  if (!isCurrentStoryAssetPaidQualityReview(enabled10))
    return prepareLegacyStoryAssetQualityRevalidationDraft(enabled10);
  const cloneValue4 = cloneValue(enabled10),
    list52 =
      Array['isArray'](cloneValue4['qualityReview']?.['kinds']) &&
      cloneValue4['qualityReview']['kinds']['length']
        ? cloneValue4['qualityReview']['kinds']
        : ['character', 'scene', 'prop'],
    list53 =
      cloneValue4['strategy'] === STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY
        ? Array['isArray'](cloneValue4['qualityReview']?.['batchIds'])
          ? cloneValue4['qualityReview']['batchIds']
          : getStoryAssetProtectedPaidBatchKeys(cloneValue4)
        : [],
    list54 =
      cloneValue4['strategy'] === STORY_ASSET_PARALLEL_DRAFT_STRATEGY
        ? list52['filter']((value118) => !isStoryAssetPaidLaneRerunAuthorized(value116, value118))
        : [],
    list55 =
      cloneValue4['strategy'] === STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY
        ? list53['filter']((value119) => !isStoryAssetPaidBatchRerunAuthorized(value116, value119))
        : [];
  if (list54['length'] || list55['length'])
    throw createStoryAssetQualityRerunRequiredError(
      cloneValue4,
      list54['length'] ? list54 : list52,
      list55['length'] ? list55 : list53,
    );
  if (cloneValue4['strategy'] === STORY_ASSET_PARALLEL_DRAFT_STRATEGY)
    list52['forEach']((value120) => {
      archiveAndResetStoryAssetQualityLane(cloneValue4, value120);
    });
  else
    cloneValue4['strategy'] === STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY &&
      archiveAndResetStoryAssetQualityBatches(cloneValue4, list53);
  const list56 = Array['isArray'](cloneValue4['qualityReviewHistory'])
    ? cloneValue4['qualityReviewHistory']
    : [];
  return (
    list56['push']({
      ...cloneValue(cloneValue4['qualityReview']),
      recoveredAt: Date['now'](),
      recoveryReason: 'authorized-quality-rerun',
    }),
    (cloneValue4['qualityReviewHistory'] = list56),
    delete cloneValue4['qualityReview'],
    (cloneValue4['updatedAt'] = Date['now']()),
    await value117?.(cloneValue(cloneValue4)),
    cloneValue4
  );
}
export async function extractStoryAssetsHybridExperimental({
  project: project = {},
  episodes: episodes = [],
  preferLocal: preferLocal = !![],
  localExtract: localExtract = undefined,
  onProgress: onProgress = null,
  onCheckpoint: onCheckpoint = null,
  resumeDraft: resumeDraft = null,
  diagnostics: diagnostics = null,
  ...args16
} = {}) {
  const sourceScenes = normalizeStoryAssetExtractionSources(episodes),
    requirementEvidence = createStoryAssetRequirementEvidencePlan(sourceScenes),
    requiredAssetNamesByKind3 = {
      character: getHardRequiredStoryAssetNames(requirementEvidence, 'character'),
      scene: collectRequiredStorySceneNames(requirementEvidence),
      prop: getHardRequiredStoryAssetNames(requirementEvidence, 'prop'),
    },
    requiredAssetsByKind3 = createStoryAssetRequiredContractsByKind({
      project: project,
      requirementEvidence: requirementEvidence,
      sourceScenes: sourceScenes,
      requiredAssetNamesByKind: requiredAssetNamesByKind3,
    }),
    nextSourceFingerprint2 = createStoryAssetAuthoritativeSourceFingerprint(sourceScenes),
    previousSourceFingerprint2 = String(resumeDraft?.['hybridAuthoritativeSourceFingerprint'] || '')[
      'trim'
    ](),
    value121 = Boolean(previousSourceFingerprint2 && previousSourceFingerprint2 !== nextSourceFingerprint2),
    enabled11 = Boolean(
      value121 &&
      Number(resumeDraft?.['hybridQualityPolicyVersion']) >= 0x5 &&
      Number(resumeDraft?.['hybridQualityPolicyVersion']) <= STORY_ASSET_HYBRID_QUALITY_POLICY_VERSION &&
      hasSameStoryAssetAuthoritativeContent(resumeDraft?.['hybridEvidenceScenes'], sourceScenes),
    ),
    value122 = Boolean(value121 && !enabled11);
  enabled11 &&
    reportDiagnostics(diagnostics, 'story-asset-hybrid-resume', {
      status: 'compatibility-migration',
      reason: 'derived-character-normalization-drift',
    });
  const value123 = args16?.['paidRerunAuthorization'],
    paidKinds =
      value122 && resumeDraft?.['strategy'] === STORY_ASSET_PARALLEL_DRAFT_STRATEGY
        ? getStoryAssetPaidDraftKinds(resumeDraft)
        : [],
    paidBatchKeys =
      value122 && resumeDraft?.['strategy'] === STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY
        ? getStoryAssetProtectedPaidBatchKeys(resumeDraft)
        : [],
    unauthorizedKinds = paidKinds['filter'](
      (value124) => !isStoryAssetPaidLaneRerunAuthorized(value123, value124),
    ),
    unauthorizedBatchKeys = paidBatchKeys['filter'](
      (value125) => !isStoryAssetPaidBatchRerunAuthorized(value123, value125),
    );
  if (unauthorizedKinds['length'] || unauthorizedBatchKeys['length']) {
    const response10 = cloneValue(resumeDraft);
    ((response10['status'] = 'blocked'),
      (response10['hybridSourceChangeReview'] = {
        status: 'blocked',
        reason: 'authoritative-source-changed',
        previousSourceFingerprint: previousSourceFingerprint2,
        nextSourceFingerprint: nextSourceFingerprint2,
        paidKinds: paidKinds,
        unauthorizedKinds: unauthorizedKinds,
        paidBatchKeys: paidBatchKeys,
        unauthorizedBatchKeys: unauthorizedBatchKeys,
      }),
      (response10['kindStates'] =
        response10['kindStates'] && typeof response10['kindStates'] === 'object'
          ? response10['kindStates']
          : {}),
      unauthorizedKinds['forEach']((kind5) => {
        response10['kindStates'][kind5] = {
          ...(response10['kindStates'][kind5] || {}),
          kind: kind5,
          status: 'blocked-source-changed',
          errorType: 'authoritative-source-changed',
          errorMessage: '剧本权威正文已变化；需要用户明确授权后才能重新提交该付费通道。',
        };
      }),
      (response10['batchSubmissionRecords'] =
        response10['batchSubmissionRecords'] && typeof response10['batchSubmissionRecords'] === 'object'
          ? response10['batchSubmissionRecords']
          : {}),
      unauthorizedBatchKeys['forEach']((value126) => {
        const response11 = response10['batchSubmissionRecords'][value126];
        if (!response11) return;
        (response11['status'] !== 'blocked-incompatible' &&
          (response11['incompatiblePreviousStatus'] = response11['status']),
          (response11['status'] = 'blocked-incompatible'),
          (response11['errorType'] = 'authoritative-source-changed'),
          (response11['errorMessage'] = '剧本权威正文已变化；需要逐批明确授权后才能重新提交该付费批次。'),
          (response11['blockedAt'] = Date['now']()));
      }),
      (response10['failures'] = unauthorizedKinds['map']((kind6) => ({
        stage: 'kind',
        kind: kind6,
        errorType: 'authoritative-source-changed',
        errorMessage: '剧本权威正文已变化；需要用户明确授权后才能重新提交该付费通道。',
      }))),
      (response10['updatedAt'] = Date['now']()),
      await onCheckpoint?.(response10));
    const error21 = new Error('剧本权威正文已变化；已有付费提交未获得精确授权，未自动重新请求。');
    ((error21['type'] = 'ASSET_AUTHORITATIVE_SOURCE_CHANGED'),
      (error21['blockedKinds'] = unauthorizedKinds),
      (error21['blockedBatchIds'] = unauthorizedBatchKeys),
      (error21['assetExtractionDraft'] = cloneValue(response10)));
    throw error21;
  }
  if (value122 && paidKinds['length']) {
    const args17 = Array['isArray'](resumeDraft?.['hybridPaidSourceHistory'])
        ? cloneValue(resumeDraft['hybridPaidSourceHistory'])
        : [],
      value127 = [
        ...args17,
        createStoryAssetSourceChangePaidHistoryEntry(
          resumeDraft,
          paidKinds,
          previousSourceFingerprint2,
          nextSourceFingerprint2,
        ),
      ],
      value128 = onCheckpoint;
    onCheckpoint = async (args18) => {
      await value128?.({ ...args18, hybridPaidSourceHistory: cloneValue(value127) });
    };
  }
  if (value122 && paidBatchKeys['length']) {
    const cloneValue5 = cloneValue(resumeDraft?.['paidBatchHistory'] || {});
    paidBatchKeys['forEach']((value129) => {
      const list57 = Array['isArray'](cloneValue5[value129]) ? cloneValue5[value129] : [];
      (list57['push']({
        ...cloneValue(resumeDraft?.['batchSubmissionRecords']?.[value129]),
        archivedAt: Date['now'](),
        archiveReason: 'authorized-authoritative-source-change-rerun',
        previousSourceFingerprint: previousSourceFingerprint2,
        nextSourceFingerprint: nextSourceFingerprint2,
      }),
        (cloneValue5[value129] = list57));
    });
    const value130 = onCheckpoint;
    onCheckpoint = async (args19) => {
      const value131 =
          args19?.['paidBatchHistory'] && typeof args19['paidBatchHistory'] === 'object'
            ? args19['paidBatchHistory']
            : {},
        paidBatchHistory = cloneValue(cloneValue5);
      (Object['entries'](value131)['forEach'](([value132, value133]) => {
        paidBatchHistory[value132] = [
          ...(Array['isArray'](paidBatchHistory[value132]) ? paidBatchHistory[value132] : []),
          ...(Array['isArray'](value133) ? cloneValue(value133) : []),
        ];
      }),
        await value130?.({ ...args19, paidBatchHistory: paidBatchHistory }));
    };
  }
  let resumeDraft3 = value122 ? null : resumeDraft;
  resumeDraft3 = await prepareStoryAssetQualityRecoveryDraft(resumeDraft3, value123, onCheckpoint);
  value122 &&
    reportDiagnostics(diagnostics, 'story-asset-hybrid-resume', {
      status: 'invalidated',
      reason: 'authoritative-source-changed',
    });
  const run = async ({
      extractionMode: extractionMode,
      localRuntime: localRuntime = null,
      candidateInventory: candidateInventory = null,
      capacityError: capacityError,
    }) => {
      const sourceScenes2 =
          resumeDraft3?.['strategy'] === STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY &&
          Array['isArray'](resumeDraft3?.['hybridEvidenceScenes']) &&
          resumeDraft3['hybridEvidenceScenes']['length']
            ? cloneValue(resumeDraft3['hybridEvidenceScenes'])
            : sourceScenes,
        resumeDraft4 = Boolean(resumeDraft3?.['strategy'] === STORY_ASSET_PARALLEL_DRAFT_STRATEGY),
        paidKinds2 = resumeDraft4 ? getStoryAssetPaidDraftKinds(resumeDraft3) : [],
        unauthorizedKinds2 = paidKinds2['filter'](
          (value134) => !isStoryAssetPaidLaneRerunAuthorized(value123, value134),
        );
      if (unauthorizedKinds2['length']) {
        const response12 = cloneValue(resumeDraft3);
        ((response12['status'] = 'blocked'),
          (response12['hybridCapacityReview'] = {
            status: 'blocked',
            reason: 'parallel-contract-over-capacity',
            paidKinds: paidKinds2,
            unauthorizedKinds: unauthorizedKinds2,
            capacityDetails: cloneValue(capacityError?.['capacityDetails']),
          }),
          (response12['kindStates'] =
            response12['kindStates'] && typeof response12['kindStates'] === 'object'
              ? response12['kindStates']
              : {}),
          unauthorizedKinds2['forEach']((kind7) => {
            response12['kindStates'][kind7] = {
              ...(response12['kindStates']?.[kind7] || {}),
              kind: kind7,
              status: 'blocked-incompatible',
              errorType: 'capacity-strategy-incompatible',
              errorMessage:
                '当前完整输出合同需要切换到证据分批链；需要用户明确授权后才能重新提交该付费通道。',
            };
          }),
          (response12['updatedAt'] = Date['now']()),
          await onCheckpoint?.(response12));
        const error22 = new Error(
          '完整输出合同超过单路安全容量；' +
            unauthorizedKinds2['join']('、') +
            '已有付费结果，未自动切换并重新请求。',
        );
        ((error22['type'] = 'ASSET_CONTRACT_INCOMPATIBLE'),
          (error22['blockedKinds'] = unauthorizedKinds2),
          (error22['assetExtractionDraft'] = cloneValue(response12)));
        throw error22;
      }
      reportDiagnostics(diagnostics, 'story-asset-hybrid-capacity-route', {
        status: 'started',
        extractionMode: extractionMode,
        ...(capacityError?.['capacityDetails'] || {}),
        requestLimit: 0x3,
      });
      const value135 =
        resumeDraft4 && paidKinds2['length']
          ? [
              ...(Array['isArray'](resumeDraft3?.['hybridPaidStrategyHistory'])
                ? cloneValue(resumeDraft3['hybridPaidStrategyHistory'])
                : []),
              {
                ...createStoryAssetSourceChangePaidHistoryEntry(
                  resumeDraft3,
                  paidKinds2,
                  resumeDraft3?.['hybridAuthoritativeSourceFingerprint'] || '',
                  nextSourceFingerprint2,
                ),
                reason: 'authorized-capacity-strategy-rerun',
                capacityDetails: cloneValue(capacityError?.['capacityDetails']),
              },
            ]
          : null;
      let hybridQualityPolicyVersion = null;
      const onCheckpoint2 = async (args20) => {
        const value136 = {
          ...args20,
          hybridQualityPolicyVersion: STORY_ASSET_HYBRID_QUALITY_POLICY_VERSION,
          hybridExtractionMode: extractionMode,
          hybridCapacityFallback: {
            strategy: 'evidence-batched-api',
            requestLimit: 0x3,
            capacityDetails: cloneValue(capacityError?.['capacityDetails']),
          },
          hybridEvidenceScenes: cloneValue(sourceScenes2),
          hybridLocalRuntime: localRuntime || args20?.['hybridLocalRuntime'] || null,
          ...(candidateInventory ? { hybridCandidateInventory: cloneValue(candidateInventory) } : {}),
          ...(value135 ? { hybridPaidStrategyHistory: cloneValue(value135) } : {}),
          hybridAuthoritativeSourceFingerprint: nextSourceFingerprint2,
        };
        ((hybridQualityPolicyVersion = cloneValue(value136)), await onCheckpoint?.(value136));
      };
      let extractStoryAssetsEvidenceBatched2 = null;
      try {
        extractStoryAssetsEvidenceBatched2 = await extractStoryAssetsEvidenceBatched({
          ...args16,
          project: project,
          episodes: episodes,
          sourceScenes: sourceScenes2,
          authoritativeSourceScenes: createHardAuthoritativeSourceScenes(sourceScenes, requirementEvidence),
          diagnostics: diagnostics,
          onProgress: onProgress,
          resumeDraft: resumeDraft4 ? null : resumeDraft3,
          allowLocalBaselineFallback: ![],
          requestLimit: 0x3,
          onCheckpoint: onCheckpoint2,
        });
      } catch (value137) {
        hybridQualityPolicyVersion &&
          [
            'ASSET_EXTRACTION_CONTINUE_REQUIRED',
            'ASSET_SUBMISSION_AMBIGUOUS',
            'ASSET_PAID_RESULT_BLOCKED',
            'ASSET_CONTRACT_INCOMPATIBLE',
          ]['includes'](value137?.['type']) &&
          (value137['assetExtractionDraft'] = {
            ...cloneValue(hybridQualityPolicyVersion),
            ...cloneValue(value137['assetExtractionDraft'] || {}),
            hybridQualityPolicyVersion: hybridQualityPolicyVersion['hybridQualityPolicyVersion'],
            hybridExtractionMode: hybridQualityPolicyVersion['hybridExtractionMode'],
            hybridCapacityFallback: cloneValue(hybridQualityPolicyVersion['hybridCapacityFallback']),
            hybridEvidenceScenes: cloneValue(hybridQualityPolicyVersion['hybridEvidenceScenes']),
            hybridLocalRuntime: cloneValue(hybridQualityPolicyVersion['hybridLocalRuntime']),
            hybridCandidateInventory: cloneValue(hybridQualityPolicyVersion['hybridCandidateInventory']),
            hybridAuthoritativeSourceFingerprint:
              hybridQualityPolicyVersion['hybridAuthoritativeSourceFingerprint'],
          });
        throw value137;
      }
      const extractionStrategy = removeNarrativeUploadFallbackCharacterAssets(
        extractStoryAssetsEvidenceBatched2,
        requirementEvidence,
        sourceScenes,
        sourceScenes,
      );
      try {
        assertStoryAssetPublicResultQuality(extractionStrategy, sourceScenes, requiredAssetNamesByKind3);
      } catch (value138) {
        await checkpointStoryAssetQualityFailure(value138, hybridQualityPolicyVersion, onCheckpoint2);
        throw value138;
      }
      return {
        ...extractionStrategy,
        extractionStrategy: extractionStrategy['extractionStrategy'],
        extractionMode: extractionMode,
        localRuntime: localRuntime,
      };
    },
    hasCompleteStructuredStorySceneEvidence2 = hasCompleteStructuredStorySceneEvidence(
      sourceScenes,
      requirementEvidence,
    );
  if (shouldUseDirectStoryAssetApi(project, sourceScenes)) {
    const chapterCharacters = getStoryProjectChapterCharacters(project),
      reusableStoryAssetCandidateInventory = getReusableStoryAssetCandidateInventory(
        resumeDraft3,
        nextSourceFingerprint2,
        enabled11 ? [resumeDraft3?.['hybridAuthoritativeSourceFingerprint']] : [],
      ),
      value139 = Boolean(resumeDraft3 && !reusableStoryAssetCandidateInventory);
    let localRuntime2 = reusableStoryAssetCandidateInventory;
    if (!localRuntime2 && value139)
      localRuntime2 = createStoryAssetCandidateInventory({
        status: 'disabled',
        sourceFingerprint: nextSourceFingerprint2,
      });
    else {
      if (!localRuntime2 && !preferLocal)
        localRuntime2 = createStoryAssetCandidateInventory({
          status: 'disabled',
          sourceFingerprint: nextSourceFingerprint2,
        });
      else {
        if (!localRuntime2)
          try {
            const model = await extractStoryAssetMentionsLocal({
                sourceScenes: sourceScenes,
                ...(typeof localExtract === 'function' ? { localExtract: localExtract } : {}),
                onProgress: onProgress,
              }),
              evidenceCharacters = model['mentions']['length']
                ? createStoryAssetLocalEvidenceScenes(sourceScenes, model['mentions'])
                : [],
              localRuntime3 = {
                model: model['model'],
                device: model['device'],
                precision: model['precision'],
                mentionCount: model['mentions']['length'],
                originalCharacters: sourceScenes['reduce'](
                  (value140, dom4) => value140 + dom4['body']['length'],
                  0x0,
                ),
                evidenceCharacters: evidenceCharacters['reduce'](
                  (value141, dom5) => value141 + dom5['body']['length'],
                  0x0,
                ),
              };
            ((localRuntime2 = createStoryAssetCandidateInventory({
              status: 'ready',
              evidenceScenes: evidenceCharacters,
              localRuntime: localRuntime3,
              sourceFingerprint: nextSourceFingerprint2,
            })),
              reportDiagnostics(diagnostics, 'story-asset-hybrid-local', {
                status: 'succeeded',
                ...localRuntime3,
                purpose: 'optional-candidate-inventory',
              }));
          } catch (error23) {
            ((localRuntime2 = createStoryAssetCandidateInventory({
              status: 'unavailable',
              sourceFingerprint: nextSourceFingerprint2,
            })),
              reportDiagnostics(diagnostics, 'story-asset-hybrid-local', {
                status: 'fallback',
                purpose: 'optional-candidate-inventory',
                errorMessage: String(error23?.['message'] || error23 || ''),
              }));
          }
      }
    }
    const project2 = createBudgetedStoryAssetEvidenceProject(project, sourceScenes, {
        requirementEvidence: requirementEvidence,
        includeAllSceneHeadings: !![],
        includeAllSceneCharacters: !![],
        bodyCharacterBudget: STORY_ASSET_DIRECT_API_MAX_SOURCE_CHARACTERS,
      }),
      value142 =
        localRuntime2['status'] === 'ready' && localRuntime2['evidenceScenes']['length']
          ? createStoryAssetOptionalCandidatesByKind(localRuntime2['evidenceScenes'], sourceScenes, {
              maxItemsPerKind: STORY_ASSET_CANDIDATE_MAX_ITEMS_PER_KIND,
              maxCharactersPerKind: STORY_ASSET_CANDIDATE_MAX_CHARACTERS_PER_KIND,
              hardRequiredAssetNamesByKind: requiredAssetNamesByKind3,
            })
          : createEmptyStoryAssetCandidatesByKind(),
      candidateAssetsByKind3 = mergeStoryAssetActionPropCandidates(value142, sourceScenes);
    let responseModeByKind3 = null;
    try {
      responseModeByKind3 = resolveStoryAssetFocusedOutputMode({
        requiredAssetNamesByKind: requiredAssetNamesByKind3,
        candidateAssetsByKind: candidateAssetsByKind3,
        maxOutputTokens: STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
      });
    } catch (capacityError2) {
      if (capacityError2?.['type'] !== 'ASSET_OUTPUT_CAPACITY') throw capacityError2;
      return run({
        extractionMode: 'parallel-api-capacity-batched',
        localRuntime: localRuntime2['localRuntime'] || null,
        candidateInventory: localRuntime2,
        capacityError: capacityError2,
      });
    }
    const candidateAssetsByKind4 = responseModeByKind3['candidateAssetsByKind'];
    (reportDiagnostics(diagnostics, 'story-asset-hybrid-parallel-api', {
      status: 'started',
      chapterCharacters: chapterCharacters,
      sourceSceneCount: sourceScenes['length'],
    }),
      onProgress?.({
        stage: 'parallel-api-asset-extraction',
        current: 0x0,
        total: 0x3,
        message:
          '完整剧本共 ' + chapterCharacters + ' 字，正在分别提取角色、场景与道具；三类各调用一次且不自动重试',
      }));
    const resumeDraft5 = resumeDraft3,
      resumeRequiredAssetNamesByKindAliases = createStoryAssetQualityResumeRequirementAliases(
        resumeDraft3,
        requiredAssetNamesByKind3,
        sourceScenes,
      ),
      resumeSourceAliases =
        resumeDraft3 && Number(resumeDraft3?.['hybridQualityPolicyVersion'] || 0x0) < 0x5
          ? [{ project: project, requiredAssetNamesByKind: requiredAssetNamesByKind3 }]
          : [],
      isStoryAssetSceneHeadingContractMigration2 = isStoryAssetSceneHeadingContractMigration({
        resumeDraft: resumeDraft5,
        requiredAssetNamesByKind: requiredAssetNamesByKind3,
        requiredAssetsByKind: requiredAssetsByKind3,
        candidateAssetsByKind: candidateAssetsByKind4,
        responseModeByKind: responseModeByKind3['modeByKind'],
      }),
      allowSavedPaidResultContractRevalidation = isStoryAssetSceneHeadingContractMigration2;
    isStoryAssetSceneHeadingContractMigration2 &&
      (resumeSourceAliases['push']({
        project: project2,
        requiredAssetNamesByKind: getSavedStoryAssetRequiredNamesByKind(resumeDraft5),
      }),
      reportDiagnostics(diagnostics, 'story-asset-hybrid-resume', {
        status: 'compatibility-migration',
        reason: 'scene-heading-label-normalization',
      }));
    let cloneValue6 = null;
    const extractStoryAssetsParallel2 = await extractStoryAssetsParallel({
        ...args16,
        project: project2,
        requiredAssetNamesByKind: requiredAssetNamesByKind3,
        requiredAssetsByKind: requiredAssetsByKind3,
        candidateAssetsByKind: candidateAssetsByKind4,
        compactOutputByKind: responseModeByKind3['modeByKind'],
        resumeRequiredAssetNamesByKindAliases: resumeRequiredAssetNamesByKindAliases,
        resumeSourceAliases: resumeSourceAliases,
        resumeSourceFingerprintAliases: [],
        allowSavedPaidResultContractRevalidation: allowSavedPaidResultContractRevalidation,
        allowOversizedPrompt: !![],
        automaticRecovery: ![],
        structuredOutputFallback: 'none',
        maxOutputTokens: STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
        onCheckpoint: async (args21) => {
          const value143 = {
            ...args21,
            hybridQualityPolicyVersion: STORY_ASSET_HYBRID_QUALITY_POLICY_VERSION,
            hybridExtractionMode: 'parallel-api',
            hybridEvidenceScenes: cloneValue(sourceScenes),
            hybridCandidateInventory: cloneValue(localRuntime2),
            hybridAuthoritativeSourceFingerprint: nextSourceFingerprint2,
          };
          ((cloneValue6 = cloneValue(value143)), await onCheckpoint?.(value143));
        },
        resumeDraft: resumeDraft5,
        resumeCompatibilityPolicyVersion: Number(resumeDraft3?.['hybridQualityPolicyVersion'] || 0x0),
        onProgress: onProgress,
      }),
      assetCount3 = removeNarrativeUploadFallbackCharacterAssets(
        consolidateDirectStorySceneAssets(
          lockStoryAssetRequiredSourceChapterIds(
            extractStoryAssetsParallel2,
            requiredAssetsByKind3,
            candidateAssetsByKind4,
          ),
          requiredAssetNamesByKind3['scene'],
        ),
        requirementEvidence,
        sourceScenes,
        sourceScenes,
      );
    try {
      assertStoryAssetPublicResultQuality(assetCount3, sourceScenes, requiredAssetNamesByKind3);
    } catch (value144) {
      await checkpointStoryAssetQualityFailure(value144, cloneValue6, onCheckpoint);
      throw value144;
    }
    return (
      reportDiagnostics(diagnostics, 'story-asset-hybrid-parallel-api', {
        status: 'succeeded',
        chapterCharacters: chapterCharacters,
        assetCount: assetCount3['assets']['length'],
      }),
      { ...assetCount3, extractionMode: 'parallel-api', localRuntime: localRuntime2['localRuntime'] || null }
    );
  }
  let extractionMode2 = 'api-fallback',
    localRuntime4 = null,
    value145 = ![];
  const value146 =
      resumeDraft3?.['qualityReview']?.['status'] === 'blocked'
        ? String(resumeDraft3?.['hybridExtractionMode'] || '')['trim']()
        : '',
    value147 = Boolean(
      Array['isArray'](resumeDraft3?.['hybridEvidenceScenes']) &&
      (resumeDraft3?.['hybridExtractionMode'] === 'local-pp-uie' ||
        resumeDraft3?.['strategy'] === STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY),
    );
  let evidenceCharacters2 = value147 ? cloneValue(resumeDraft3['hybridEvidenceScenes']) : null;
  if (value146 === 'api-fallback')
    ((value145 =
      resumeDraft3?.['strategy'] === STORY_ASSET_PARALLEL_DRAFT_STRATEGY &&
      Array['isArray'](resumeDraft3?.['hybridEvidenceScenes'])),
      (evidenceCharacters2 = value145 ? cloneValue(resumeDraft3['hybridEvidenceScenes']) : sourceScenes));
  else {
    if (preferLocal && !evidenceCharacters2)
      try {
        const model2 = await extractStoryAssetMentionsLocal({
          sourceScenes: sourceScenes,
          ...(typeof localExtract === 'function' ? { localExtract: localExtract } : {}),
          onProgress: onProgress,
        });
        if (!model2['mentions']['length'] && !hasCompleteStructuredStorySceneEvidence2)
          throw createMissingLocalStoryAssetEvidenceError();
        ((evidenceCharacters2 = createStoryAssetLocalEvidenceScenes(sourceScenes, model2['mentions'])),
          (extractionMode2 = 'local-pp-uie'),
          (localRuntime4 = {
            model: model2['model'],
            device: model2['device'],
            precision: model2['precision'],
            mentionCount: model2['mentions']['length'],
            originalCharacters: sourceScenes['reduce'](
              (value148, dom6) => value148 + dom6['body']['length'],
              0x0,
            ),
            evidenceCharacters: evidenceCharacters2['reduce'](
              (value149, dom7) => value149 + dom7['body']['length'],
              0x0,
            ),
          }),
          reportDiagnostics(diagnostics, 'story-asset-hybrid-local', {
            status: 'succeeded',
            ...localRuntime4,
          }),
          onProgress?.({
            stage: 'local-evidence-ready',
            current: 0x1,
            total: 0x1,
            message:
              'PP-UIE 已把正文压缩为 ' +
              localRuntime4['evidenceCharacters'] +
              ' 字证据，正在按资产建立档案并调用 API 核验事实、补全视觉',
          }));
      } catch (error24) {
        if (!hasCompleteStructuredStorySceneEvidence2) {
          reportDiagnostics(diagnostics, 'story-asset-hybrid-local', {
            status: 'stopped',
            errorMessage: String(error24?.['message'] || error24 || ''),
            apiRequestCount: 0x0,
          });
          throw createMissingLocalStoryAssetEvidenceError(error24);
        }
        ((extractionMode2 = 'api-fallback'),
          (evidenceCharacters2 = createStoryAssetLocalEvidenceScenes(sourceScenes, [])),
          (value145 = !![]),
          reportDiagnostics(diagnostics, 'story-asset-hybrid-local', {
            status: 'fallback',
            errorMessage: String(error24?.['message'] || error24 || ''),
          }),
          onProgress?.({
            stage: 'local-evidence-fallback',
            current: 0x0,
            total: 0x1,
            message: '本地 PP-UIE 不可用，已改用结构化首尾证据；角色、场景、道具各调用一次且不自动重试',
          }));
      }
    else
      evidenceCharacters2
        ? ((extractionMode2 = 'local-pp-uie'),
          (localRuntime4 = resumeDraft3?.['hybridLocalRuntime']
            ? cloneValue(resumeDraft3['hybridLocalRuntime'])
            : null))
        : ((evidenceCharacters2 = createStoryAssetLocalEvidenceScenes(sourceScenes, [])), (value145 = !![]));
  }
  if (extractionMode2 === 'local-pp-uie' || value145) {
    const resumeDraft6 = resumeDraft3,
      resumeRequiredAssetNamesByKindAliases2 = createStoryAssetQualityResumeRequirementAliases(
        resumeDraft3,
        requiredAssetNamesByKind3,
        sourceScenes,
      ),
      project3 = createBudgetedStoryAssetEvidenceProject(project, evidenceCharacters2, {
        requirementEvidence: requirementEvidence,
      }),
      includeAllSceneHeadings = Number(resumeDraft3?.['hybridQualityPolicyVersion']) || 0x0,
      resumeSourceAliases2 = resumeRequiredAssetNamesByKindAliases2['map']((requiredAssetNamesByKind4) => ({
        project: createBudgetedStoryAssetEvidenceProject(
          project,
          evidenceCharacters2,
          includeAllSceneHeadings >= 0x3
            ? { requirementEvidence: requirementEvidence, includeAllSceneCharacters: !![] }
            : { includeAllSceneHeadings: !![], includeAllSceneCharacters: !![] },
        ),
        requiredAssetNamesByKind: requiredAssetNamesByKind4,
      }));
    resumeDraft3 &&
      includeAllSceneHeadings < 0x5 &&
      resumeSourceAliases2['push']({
        project: createBudgetedStoryAssetEvidenceProject(project, evidenceCharacters2, {
          requirementEvidence: requirementEvidence,
          includeAllSceneHeadings: includeAllSceneHeadings < 0x3,
          includeAllSceneCharacters: !![],
          bodyCharacterBudget: Number['MAX_SAFE_INTEGER'],
        }),
        requiredAssetNamesByKind: requiredAssetNamesByKind3,
      });
    const candidateAssetsByKind5 = mergeStoryAssetActionPropCandidates(
      createStoryAssetOptionalCandidatesByKind(evidenceCharacters2, sourceScenes, {
        maxItemsPerKind: STORY_ASSET_CANDIDATE_MAX_ITEMS_PER_KIND,
        maxCharactersPerKind: STORY_ASSET_CANDIDATE_MAX_CHARACTERS_PER_KIND,
        hardRequiredAssetNamesByKind: requiredAssetNamesByKind3,
      }),
      sourceScenes,
    );
    let responseModeByKind4 = null;
    try {
      responseModeByKind4 = resolveStoryAssetFocusedOutputMode({
        requiredAssetNamesByKind: requiredAssetNamesByKind3,
        candidateAssetsByKind: candidateAssetsByKind5,
        maxOutputTokens: STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
      });
    } catch (capacityError3) {
      if (capacityError3?.['type'] !== 'ASSET_OUTPUT_CAPACITY') throw capacityError3;
      return run({
        extractionMode: extractionMode2 + '-capacity-batched',
        localRuntime: localRuntime4,
        capacityError: capacityError3,
      });
    }
    const candidateAssetsByKind6 = responseModeByKind4['candidateAssetsByKind'],
      isStoryAssetSceneHeadingContractMigration3 = isStoryAssetSceneHeadingContractMigration({
        resumeDraft: resumeDraft6,
        requiredAssetNamesByKind: requiredAssetNamesByKind3,
        requiredAssetsByKind: requiredAssetsByKind3,
        candidateAssetsByKind: candidateAssetsByKind6,
        responseModeByKind: responseModeByKind4['modeByKind'],
      }),
      allowSavedPaidResultContractRevalidation2 = isStoryAssetSceneHeadingContractMigration3;
    isStoryAssetSceneHeadingContractMigration3 &&
      (resumeSourceAliases2['push']({
        project: project3,
        requiredAssetNamesByKind: getSavedStoryAssetRequiredNamesByKind(resumeDraft6),
      }),
      reportDiagnostics(diagnostics, 'story-asset-hybrid-resume', {
        status: 'compatibility-migration',
        reason: 'scene-heading-label-normalization',
      }));
    onProgress?.({
      stage: 'parallel-api-asset-extraction',
      current: 0x0,
      total: 0x3,
      message:
        extractionMode2 === 'local-pp-uie'
          ? '本地证据已准备，正在并行反推角色、场景与道具；三类各调用一次且不自动重试'
          : '结构化证据已准备，正在并行反推角色、场景与道具；三类各调用一次且不自动重试',
    });
    let cloneValue7 = null;
    const onCheckpoint3 = async (args22) => {
        const value150 = {
          ...args22,
          hybridQualityPolicyVersion: STORY_ASSET_HYBRID_QUALITY_POLICY_VERSION,
          hybridExtractionMode: extractionMode2,
          hybridEvidenceScenes: cloneValue(evidenceCharacters2),
          hybridLocalRuntime: localRuntime4 || args22?.['hybridLocalRuntime'] || null,
          hybridAuthoritativeSourceFingerprint: nextSourceFingerprint2,
        };
        ((cloneValue7 = cloneValue(value150)), await onCheckpoint?.(value150));
      },
      extractStoryAssetsParallel3 = await extractStoryAssetsParallel({
        ...args16,
        project: project3,
        requiredAssetNamesByKind: requiredAssetNamesByKind3,
        requiredAssetsByKind: requiredAssetsByKind3,
        candidateAssetsByKind: candidateAssetsByKind6,
        compactOutputByKind: responseModeByKind4['modeByKind'],
        resumeRequiredAssetNamesByKindAliases: resumeRequiredAssetNamesByKindAliases2,
        resumeSourceAliases: resumeSourceAliases2,
        resumeSourceFingerprintAliases: [],
        allowSavedPaidResultContractRevalidation: allowSavedPaidResultContractRevalidation2,
        allowOversizedPrompt: !![],
        automaticRecovery: ![],
        structuredOutputFallback: 'none',
        maxOutputTokens: STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
        resumeDraft: resumeDraft6,
        resumeCompatibilityPolicyVersion: Number(resumeDraft3?.['hybridQualityPolicyVersion'] || 0x0),
        onProgress: onProgress,
        onCheckpoint: onCheckpoint3,
      }),
      args23 = removeNarrativeUploadFallbackCharacterAssets(
        consolidateDirectStorySceneAssets(
          lockStoryAssetRequiredSourceChapterIds(
            extractStoryAssetsParallel3,
            requiredAssetsByKind3,
            candidateAssetsByKind6,
          ),
          requiredAssetNamesByKind3['scene'],
        ),
        requirementEvidence,
        evidenceCharacters2,
        sourceScenes,
        { requireVerifiedFallbackCharacters: !![] },
      );
    try {
      assertStoryAssetPublicResultQuality(args23, sourceScenes, requiredAssetNamesByKind3);
    } catch (value151) {
      await checkpointStoryAssetQualityFailure(value151, cloneValue7, onCheckpoint3);
      throw value151;
    }
    return {
      ...args23,
      extractionStrategy:
        extractionMode2 === 'local-pp-uie'
          ? 'local-pp-uie-plus-parallel-api'
          : 'bounded-parallel-api-fallback',
      extractionMode: extractionMode2,
      localRuntime: localRuntime4,
    };
  }
  let cloneValue8 = null;
  const onCheckpoint4 = async (args24) => {
      const value152 = {
        ...args24,
        hybridQualityPolicyVersion: STORY_ASSET_HYBRID_QUALITY_POLICY_VERSION,
        hybridExtractionMode: extractionMode2,
        hybridEvidenceScenes: extractionMode2 === 'local-pp-uie' ? cloneValue(evidenceCharacters2) : null,
        hybridLocalRuntime: localRuntime4 || args24?.['hybridLocalRuntime'] || null,
        hybridAuthoritativeSourceFingerprint: nextSourceFingerprint2,
      };
      ((cloneValue8 = cloneValue(value152)), await onCheckpoint?.(value152));
    },
    extractStoryAssetsEvidenceBatched3 = await extractStoryAssetsEvidenceBatched({
      ...args16,
      project: project,
      episodes: episodes,
      sourceScenes: evidenceCharacters2,
      authoritativeSourceScenes: createHardAuthoritativeSourceScenes(sourceScenes, requirementEvidence),
      diagnostics: diagnostics,
      onProgress: onProgress,
      resumeDraft: resumeDraft3,
      allowLocalBaselineFallback: ![],
      requestLimit: 0x3,
      onCheckpoint: onCheckpoint4,
    }),
    extractionStrategy2 = removeNarrativeUploadFallbackCharacterAssets(
      extractStoryAssetsEvidenceBatched3,
      requirementEvidence,
      evidenceCharacters2,
      sourceScenes,
    );
  try {
    assertStoryAssetPublicResultQuality(extractionStrategy2, sourceScenes, requiredAssetNamesByKind3);
  } catch (value153) {
    await checkpointStoryAssetQualityFailure(value153, cloneValue8, onCheckpoint4);
    throw value153;
  }
  return {
    ...extractionStrategy2,
    extractionStrategy: extractionStrategy2['extractionStrategy'],
    extractionMode: extractionMode2,
    localRuntime: localRuntime4,
  };
}
