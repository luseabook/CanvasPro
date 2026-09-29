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
function cloneValue(_0x2e4d3d) {
  if (!_0x2e4d3d || typeof _0x2e4d3d !== 'object') return _0x2e4d3d;
  return JSON['parse'](JSON['stringify'](_0x2e4d3d));
}
function hasSameStoryAssetAuthoritativeContent(_0x2bc3ba, _0xb3267f) {
  if (!Array['isArray'](_0x2bc3ba) || !Array['isArray'](_0xb3267f)) return ![];
  if (_0x2bc3ba['length'] !== _0xb3267f['length']) return ![];
  const _0x33cba4 = ['ref', 'episodeRef', 'source', 'heading', 'body'];
  return _0x2bc3ba['every']((_0x17a7b8, _0x205af2) => {
    const _0x233ea8 = _0xb3267f[_0x205af2];
    return _0x33cba4['every'](
      (_0x5b5af8) => String(_0x17a7b8?.[_0x5b5af8] ?? '') === String(_0x233ea8?.[_0x5b5af8] ?? ''),
    );
  });
}
function createStoryAssetFocusedContractSnapshot(
  _0x5d110e,
  {
    requiredAssetNamesByKind: _0x4c8ae8,
    requiredAssetsByKind: _0x3889d5,
    candidateAssetsByKind: _0x467f2e,
    responseModeByKind: _0xbaa802,
  },
) {
  const _0x1ac5c8 = _0xbaa802?.[_0x5d110e] === 'compact' ? 'compact' : 'verbose',
    _0x32b639 = createStoryAssetPromptContracts([_0x5d110e], _0x4c8ae8, _0x467f2e, _0x3889d5, {
      includeClientKeys: _0x1ac5c8 === 'compact',
    })['payload'];
  return {
    kind: _0x5d110e,
    responseMode: _0x1ac5c8,
    responseSchemaVersion: _0x1ac5c8 === 'compact' ? STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION : 0x1,
    requiredAssets: cloneValue(_0x32b639['requiredAssets'] || []),
    candidateAssets: cloneValue(_0x32b639['candidateAssets'] || []),
  };
}
function compareStoryAssetSceneHeadingContractRows(_0x26728c, _0x38e611) {
  if (!Array['isArray'](_0x26728c) || !Array['isArray'](_0x38e611)) return { compatible: ![], changed: ![] };
  if (_0x26728c['length'] !== _0x38e611['length']) return { compatible: ![], changed: ![] };
  let _0x571bbb = ![];
  for (let _0x34bd84 = 0x0; _0x34bd84 < _0x26728c['length']; _0x34bd84 += 0x1) {
    const _0x27a834 = _0x26728c[_0x34bd84],
      _0x3456b0 = _0x38e611[_0x34bd84];
    if (JSON['stringify'](_0x27a834) === JSON['stringify'](_0x3456b0)) continue;
    const _0xbcf035 = String(_0x27a834?.['name'] || '')['trim'](),
      _0x124804 = String(_0x3456b0?.['name'] || '')['trim']();
    if (
      !_0xbcf035 ||
      !_0x124804 ||
      _0xbcf035 === _0x124804 ||
      normalizeStorySceneHeadingIdentity(_0xbcf035) !== _0x124804
    )
      return { compatible: ![], changed: ![] };
    const _0x19759d = cloneValue(_0x27a834),
      _0x3ffe01 = cloneValue(_0x3456b0);
    (delete _0x19759d['name'],
      delete _0x19759d['clientKey'],
      delete _0x3ffe01['name'],
      delete _0x3ffe01['clientKey']);
    if (JSON['stringify'](_0x19759d) !== JSON['stringify'](_0x3ffe01))
      return { compatible: ![], changed: ![] };
    _0x571bbb = !![];
  }
  return { compatible: !![], changed: _0x571bbb };
}
function areStoryAssetSceneHeadingContractSnapshotsCompatible(_0x5775cf, _0x3205fa) {
  const _0x1c79fc = cloneValue(_0x5775cf),
    _0x4d72a3 = cloneValue(_0x3205fa);
  (delete _0x1c79fc['requiredAssets'],
    delete _0x1c79fc['candidateAssets'],
    delete _0x4d72a3['requiredAssets'],
    delete _0x4d72a3['candidateAssets']);
  if (JSON['stringify'](_0x1c79fc) !== JSON['stringify'](_0x4d72a3)) return ![];
  const _0x81889d = compareStoryAssetSceneHeadingContractRows(
    _0x5775cf?.['requiredAssets'],
    _0x3205fa?.['requiredAssets'],
  );
  if (!_0x81889d['compatible']) return ![];
  const _0x3bdd8c = compareStoryAssetSceneHeadingContractRows(
    _0x5775cf?.['candidateAssets'],
    _0x3205fa?.['candidateAssets'],
  );
  return _0x3bdd8c['compatible'] && (_0x81889d['changed'] || _0x3bdd8c['changed']);
}
function getSavedStoryAssetRequiredNamesByKind(_0x1ba4b0) {
  const _0x4c6e1e = _0x1ba4b0?.['rawResponseContractSnapshotsByKind'] || {};
  return Object['fromEntries'](
    ['character', 'scene', 'prop']['map']((_0x1075f7) => [
      _0x1075f7,
      (Array['isArray'](_0x4c6e1e?.[_0x1075f7]?.['requiredAssets'])
        ? _0x4c6e1e[_0x1075f7]['requiredAssets']
        : [])
        ['map']((_0x3e6863) => String(_0x3e6863?.['name'] || '')['trim']())
        ['filter'](Boolean),
    ]),
  );
}
function isStoryAssetSceneHeadingContractMigration({
  resumeDraft: _0x12bb92,
  requiredAssetNamesByKind: _0x3e44f7,
  requiredAssetsByKind: _0x224735,
  candidateAssetsByKind: _0x43651d,
  responseModeByKind: _0x357cfe,
} = {}) {
  if (
    Number(_0x12bb92?.['hybridQualityPolicyVersion']) !== 0x6 ||
    _0x12bb92?.['strategy'] !== STORY_ASSET_PARALLEL_DRAFT_STRATEGY ||
    _0x12bb92?.['status'] !== 'completed' ||
    _0x12bb92?.['qualityReview']
  )
    return ![];
  const _0x658418 = _0x12bb92?.['rawResponseContractSnapshotsByKind'];
  if (!_0x658418 || typeof _0x658418 !== 'object') return ![];
  const _0x239abd = Object['fromEntries'](
    ['character', 'scene', 'prop']['map']((_0xeee750) => [
      _0xeee750,
      createStoryAssetFocusedContractSnapshot(_0xeee750, {
        requiredAssetNamesByKind: _0x3e44f7,
        requiredAssetsByKind: _0x224735,
        candidateAssetsByKind: _0x43651d,
        responseModeByKind: _0x357cfe,
      }),
    ]),
  );
  if (
    JSON['stringify'](_0x658418['character']) !== JSON['stringify'](_0x239abd['character']) ||
    JSON['stringify'](_0x658418['prop']) !== JSON['stringify'](_0x239abd['prop'])
  )
    return ![];
  if (JSON['stringify'](_0x658418['scene']) === JSON['stringify'](_0x239abd['scene'])) return ![];
  return areStoryAssetSceneHeadingContractSnapshotsCompatible(_0x658418['scene'], _0x239abd['scene']);
}
function getStoryAssetPaidDraftKinds(_0x8193fe) {
  return ['character', 'scene', 'prop']['filter']((_0x45c986) => {
    const _0x34ebd1 = _0x8193fe?.['kindStates']?.[_0x45c986];
    return Boolean(
      _0x8193fe?.['paidResponseReceivedByKind']?.[_0x45c986] ||
      Object['hasOwn'](_0x8193fe?.['rawResponsesByKind'] || {}, _0x45c986) ||
      (Array['isArray'](_0x8193fe?.['assetsByKind']?.[_0x45c986]) &&
        _0x8193fe['assetsByKind'][_0x45c986]['length']) ||
      Math['max'](0x0, Math['trunc'](Number(_0x34ebd1?.['requestCount']) || 0x0)) > 0x0 ||
      [
        'running',
        'succeeded',
        'blocked-paid-response',
        'blocked-quality-rerun',
        'blocked-ambiguous-submission',
        'blocked-incompatible',
      ]['includes'](String(_0x34ebd1?.['status'] || '')),
    );
  });
}
function isStoryAssetPaidLaneRerunAuthorized(_0x3751f1, _0x23eea1) {
  return Boolean(
    _0x3751f1?.['confirmed'] === !![] &&
    Array['isArray'](_0x3751f1?.['authorizedKinds']) &&
    _0x3751f1['authorizedKinds']['includes'](_0x23eea1),
  );
}
function getStoryAssetProtectedPaidBatchKeys(_0x5bd97c) {
  const _0x50e8cf =
    _0x5bd97c?.['batchSubmissionRecords'] && typeof _0x5bd97c['batchSubmissionRecords'] === 'object'
      ? _0x5bd97c['batchSubmissionRecords']
      : {};
  return Object['entries'](_0x50e8cf)['flatMap'](([_0x48bc16, _0x79d782]) => {
    const _0x71d8e2 = String(_0x79d782?.['status'] || '')['trim'](),
      _0x1e1073 =
        _0x71d8e2 !== 'rejected-confirmed' &&
        (Math['max'](0x0, Math['trunc'](Number(_0x79d782?.['requestCount']) || 0x0)) > 0x0 ||
          Object['hasOwn'](_0x79d782 || {}, 'rawResponse') ||
          [
            'submitted',
            'ambiguous',
            'blocked-ambiguous-submission',
            'response-received',
            'blocked-paid-response',
            'blocked-quality-rerun',
            'blocked-incompatible',
            'validated',
          ]['includes'](_0x71d8e2));
    return _0x1e1073 ? [_0x48bc16] : [];
  });
}
function isStoryAssetPaidBatchRerunAuthorized(_0x59a132, _0x2ece90) {
  return Boolean(
    _0x59a132?.['confirmed'] === !![] &&
    Array['isArray'](_0x59a132?.['authorizedBatchIds']) &&
    _0x59a132['authorizedBatchIds']['includes'](_0x2ece90),
  );
}
function createStoryAssetSourceChangePaidHistoryEntry(_0x71ce9, _0x5d1aa9, _0x14d750, _0x15abb2) {
  return {
    archivedAt: Date['now'](),
    reason: 'authorized-authoritative-source-change-rerun',
    previousSourceFingerprint: _0x14d750,
    nextSourceFingerprint: _0x15abb2,
    lanes: Object['fromEntries'](
      _0x5d1aa9['map']((_0x21da69) => [
        _0x21da69,
        {
          rawResponse: Object['hasOwn'](_0x71ce9?.['rawResponsesByKind'] || {}, _0x21da69)
            ? _0x71ce9['rawResponsesByKind'][_0x21da69]
            : '',
          responseMode: _0x71ce9?.['rawResponseModesByKind']?.[_0x21da69] || '',
          contractSnapshot: cloneValue(_0x71ce9?.['rawResponseContractSnapshotsByKind']?.[_0x21da69]),
          decisions: cloneValue(_0x71ce9?.['decisionsByKind']?.[_0x21da69]),
          assets: cloneValue(_0x71ce9?.['assetsByKind']?.[_0x21da69] || []),
          submissionState: cloneValue(_0x71ce9?.['submissionStatesByKind']?.[_0x21da69]),
          kindState: cloneValue(_0x71ce9?.['kindStates']?.[_0x21da69]),
        },
      ]),
    ),
  };
}
function createEmptyStoryAssetCandidatesByKind() {
  return { character: [], scene: [], prop: [] };
}
function mergeStoryAssetContractCandidates(_0x4861ca = [], _0x3661cf = []) {
  const _0x754123 = new Map();
  return (
    [..._0x4861ca, ..._0x3661cf]['forEach']((_0x4c541f) => {
      const _0x140e06 = String(_0x4c541f?.['name'] || '')['trim'](),
        _0x272420 = normalizeStoryAssetQualityName(_0x140e06);
      if (!_0x272420) return;
      const _0x5502bf = _0x754123['get'](_0x272420);
      if (!_0x5502bf) {
        _0x754123['set'](_0x272420, cloneValue(_0x4c541f));
        return;
      }
      _0x754123['set'](_0x272420, {
        ..._0x5502bf,
        sourceSceneRefs: [
          ...new Set(
            [
              ...(Array['isArray'](_0x5502bf?.['sourceSceneRefs']) ? _0x5502bf['sourceSceneRefs'] : []),
              ...(Array['isArray'](_0x4c541f?.['sourceSceneRefs']) ? _0x4c541f['sourceSceneRefs'] : []),
            ]
              ['map']((_0x383e61) => String(_0x383e61 || '')['trim']())
              ['filter'](Boolean),
          ),
        ],
        sourceChapterIds: [
          ...new Set(
            [
              ...(Array['isArray'](_0x5502bf?.['sourceChapterIds']) ? _0x5502bf['sourceChapterIds'] : []),
              ...(Array['isArray'](_0x4c541f?.['sourceChapterIds']) ? _0x4c541f['sourceChapterIds'] : []),
            ]
              ['map']((_0x29be64) => String(_0x29be64 || '')['trim']())
              ['filter'](Boolean),
          ),
        ],
        evidence: String(_0x5502bf?.['evidence'] || _0x4c541f?.['evidence'] || '')['trim'](),
      });
    }),
    [..._0x754123['values']()]
  );
}
function mergeStoryAssetActionPropCandidates(
  _0x16addb = createEmptyStoryAssetCandidatesByKind(),
  _0x4b60ee = [],
) {
  return {
    ..._0x16addb,
    prop: mergeStoryAssetContractCandidates(
      _0x16addb?.['prop'],
      createStoryAssetActionPropCandidates(_0x4b60ee),
    ),
  };
}
function createStoryAssetCandidateInventory({
  status: _0x16cdd8,
  evidenceScenes: evidenceScenes = [],
  localRuntime: localRuntime = null,
  sourceFingerprint: _0x54042a,
} = {}) {
  return {
    schemaVersion: STORY_ASSET_CANDIDATE_INVENTORY_SCHEMA_VERSION,
    status: _0x16cdd8,
    evidenceScenes: cloneValue(Array['isArray'](evidenceScenes) ? evidenceScenes : []),
    localRuntime: localRuntime ? cloneValue(localRuntime) : null,
    sourceFingerprint: String(_0x54042a || ''),
  };
}
function getReusableStoryAssetCandidateInventory(_0x3903bd, _0x571436, _0x54d4dc = []) {
  const _0x1c37a8 = _0x3903bd?.['hybridCandidateInventory'],
    _0x3e2729 = new Set([
      String(_0x571436 || ''),
      ...(Array['isArray'](_0x54d4dc) ? _0x54d4dc['map']((_0x229439) => String(_0x229439 || '')) : []),
    ]);
  if (
    Number(_0x1c37a8?.['schemaVersion']) !== STORY_ASSET_CANDIDATE_INVENTORY_SCHEMA_VERSION ||
    !['ready', 'unavailable', 'disabled']['includes'](_0x1c37a8?.['status']) ||
    !Array['isArray'](_0x1c37a8?.['evidenceScenes']) ||
    !_0x3e2729['has'](String(_0x1c37a8?.['sourceFingerprint'] || ''))
  )
    return null;
  return { ...cloneValue(_0x1c37a8), sourceFingerprint: String(_0x571436 || '') };
}
function reportDiagnostics(_0x374ae3, _0x4253be, _0x1b2f87 = {}) {
  try {
    const _0x1b0f30 =
      typeof _0x374ae3?.['info'] === 'function'
        ? _0x374ae3['info'](_0x4253be, _0x1b2f87)
        : _0x374ae3?.['logEvent']?.({
            type:
              'story_asset.' +
              String(_0x4253be || 'hybrid')
                ['replace'](/^story-asset-?/iu, '')
                ['replace'](/[^a-z0-9]+/giu, '_'),
            level: _0x1b2f87?.['status'] === 'fallback' ? 'warn' : 'info',
            source: 'renderer',
            message: String(_0x4253be || 'Story asset hybrid extraction event'),
            context: _0x1b2f87,
          });
    _0x1b0f30 &&
      typeof _0x1b0f30['then'] === 'function' &&
      void Promise['resolve'](_0x1b0f30)['catch'](() => undefined);
  } catch {}
}
function getStoryProjectChapterCharacters(_0xc8c8ff = {}) {
  return (Array['isArray'](_0xc8c8ff?.['chapters']) ? _0xc8c8ff['chapters'] : [])['reduce'](
    (_0x772f23, _0x3e4c23) => _0x772f23 + String(_0x3e4c23?.['content'] || '')['length'],
    0x0,
  );
}
function shouldUseDirectStoryAssetApi(_0xc9451 = {}, _0x541f49 = []) {
  const _0x344745 = _0x541f49['filter']((_0x40255c) => _0x40255c?.['source'] === 'upload-fallback');
  if (_0x344745['length']) {
    const _0x40e56e = _0x344745['flatMap']((_0x523d48) =>
      Array['isArray'](_0x523d48?.['characters']) ? _0x523d48['characters'] : [],
    );
    if (!_0x40e56e['some']((_0x50591c) => !isNarrativeStoryCharacterFragment(_0x50591c))) return ![];
  }
  const _0x56aeab = _0x541f49['reduce'](
    (_0x5cded6, _0x2e3620) => _0x5cded6 + String(_0x2e3620?.['body'] || '')['length'],
    0x0,
  );
  return _0x56aeab > 0x0 && _0x56aeab <= STORY_ASSET_DIRECT_API_MAX_SOURCE_CHARACTERS;
}
function hasCompleteStructuredStorySceneEvidence(_0x3126cf = [], _0xe802de = {}) {
  const _0x33afe4 = Array['isArray'](_0x3126cf) ? _0x3126cf : [];
  if (!_0x33afe4['length']) return ![];
  const _0x3a3a8b = new Set(getHardRequiredStorySceneRefs(_0xe802de));
  return _0x33afe4['every'](
    (_0x3b3172) =>
      _0x3b3172?.['source'] !== 'upload-fallback' &&
      _0x3a3a8b['has'](String(_0x3b3172?.['ref'] || '')['trim']()),
  );
}
function createMissingLocalStoryAssetEvidenceError(_0x438847 = null) {
  return Object['assign'](
    new Error(
      '本地实体检索没有得到可验证证据，已在调用远程 API 前安全停止；请检查或重新下载 PP-UIE 组件后再试。',
    ),
    { type: 'LOCAL_ASSET_EVIDENCE_REQUIRED', cause: _0x438847 || undefined },
  );
}
function compactStoryAssetQualityText(_0x97d18d = '') {
  return String(_0x97d18d || '')['replace'](/\s+/gu, '');
}
function normalizeStoryAssetQualityName(_0x1373c4 = '') {
  return String(_0x1373c4 || '')
    ['normalize']('NFKC')
    ['replace'](/[（(][^（）()]{0,30}[）)]/gu, '')
    ['replace'](/[^\p{L}\p{N}]+/gu, '')
    ['toLowerCase']();
}
function createStoryCharacterQualityAliases(_0x74b1be = '') {
  const _0x47bcf5 = normalizeStoryAssetQualityName(_0x74b1be);
  if (!_0x47bcf5) return [];
  const _0x17b7c3 = _0x47bcf5['replace'](
    /^(?:房东|编辑|医生|护士|警察|老师|老板|经理|店员|保安|司机|队长|主任|主管)/u,
    '',
  );
  return [...new Set([_0x47bcf5, _0x17b7c3]['filter'](Boolean))];
}
function storyCharacterQualityNamesMatch(_0x4d8201 = '', _0x258421 = '') {
  const _0x24169e = createStoryCharacterQualityAliases(_0x4d8201),
    _0x1ec9a8 = createStoryCharacterQualityAliases(_0x258421);
  return _0x24169e['some']((_0x300b53) => _0x1ec9a8['includes'](_0x300b53));
}
function collectLegacyRequiredStoryCharacterNames(_0x5bd1a9 = []) {
  const _0x4624ea = [];
  return (
    (Array['isArray'](_0x5bd1a9) ? _0x5bd1a9 : [])['forEach']((_0xd6b74d) => {
      (Array['isArray'](_0xd6b74d?.['characters']) ? _0xd6b74d['characters'] : [])['forEach']((_0x158ced) => {
        !_0x4624ea['some']((_0x15f487) => storyCharacterQualityNamesMatch(_0x15f487, _0x158ced)) &&
          _0x4624ea['push'](String(_0x158ced || '')['trim']());
      });
    }),
    _0x4624ea['filter'](Boolean)
  );
}
function collectStorySceneNamesFromHeadings(_0x1d3e39 = []) {
  const _0x141b82 = [];
  return (
    (Array['isArray'](_0x1d3e39) ? _0x1d3e39 : [])['forEach']((_0xf62cbb) => {
      splitDeterministicStorySceneAssetNames(_0xf62cbb)
        ['filter'](
          (_0x378a03) =>
            _0x378a03 && !/^(?:(?:两个|多个|若干)?房间|室内|室外|同地|原地)$/u['test'](_0x378a03),
        )
        ['forEach']((_0x4a84e4) => {
          const _0x1cb382 = getStorySceneIdentityKey(_0x4a84e4);
          _0x1cb382 &&
            !_0x141b82['some']((_0x48a250) => getStorySceneIdentityKey(_0x48a250) === _0x1cb382) &&
            _0x141b82['push'](_0x4a84e4);
        });
    }),
    _0x141b82
  );
}
function collectRequiredStorySceneNames(_0x5a7468 = {}) {
  return collectStorySceneNamesFromHeadings(getHardRequiredStoryAssetNames(_0x5a7468, 'scene'));
}
function collectLegacyRequiredStorySceneNames(_0x6062d = []) {
  return collectStorySceneNamesFromHeadings(
    (Array['isArray'](_0x6062d) ? _0x6062d : [])['map'](
      (_0x3231a6) => _0x3231a6?.['assetHeading'] || _0x3231a6?.['heading'],
    ),
  );
}
function storySceneQualityNamesMatch(_0x54d334 = '', _0x112dfe = '') {
  const _0xe69907 = getStorySceneIdentityKey(_0x54d334),
    _0x4e5b0e = getStorySceneIdentityKey(_0x112dfe);
  return Boolean(
    _0xe69907 &&
    _0x4e5b0e &&
    (_0xe69907 === _0x4e5b0e || _0xe69907['includes'](_0x4e5b0e) || _0x4e5b0e['includes'](_0xe69907)),
  );
}
function getStorySceneQualitySourceRefs(_0x47626f = '', _0x41d280 = []) {
  return new Set(
    (Array['isArray'](_0x41d280) ? _0x41d280 : [])
      ['filter']((_0x453b0e) =>
        splitDeterministicStorySceneAssetNames(_0x453b0e?.['assetHeading'] || _0x453b0e?.['heading'])['some'](
          (_0x576084) => storySceneQualityNamesMatch(_0x576084, _0x47626f),
        ),
      )
      ['map']((_0x3b41e3) => String(_0x3b41e3?.['ref'] || '')['trim']())
      ['filter'](Boolean),
  );
}
function storyPropQualityRequirementMatches(_0x1521f9 = {}, _0x51d3dd = '') {
  const _0x298941 = normalizeStoryAssetQualityName(_0x51d3dd);
  if (!_0x298941) return ![];
  if (normalizeStoryAssetQualityName(_0x1521f9?.['name']) === _0x298941) return !![];
  if ([..._0x298941]['length'] < 0x3) return ![];
  const _0x1979e3 = normalizeStoryAssetQualityName(
    [
      _0x1521f9?.['scriptFacts'],
      _0x1521f9?.['description'],
      ...(Array['isArray'](_0x1521f9?.['appearances'])
        ? _0x1521f9['appearances']['flatMap']((_0x1c309c) => [
            _0x1c309c?.['scriptFacts'],
            _0x1c309c?.['description'],
          ])
        : []),
    ]
      ['filter'](Boolean)
      ['join']('\x20'),
  );
  return _0x1979e3['includes'](_0x298941);
}
function mergeStoryAssetCoverageText(_0x3d98af = []) {
  return [
    ...new Set(
      _0x3d98af['flatMap']((_0x33c956) => String(_0x33c956 || '')['split'](/[、,，；;]+/u))
        ['map']((_0x1847d4) => _0x1847d4['trim']())
        ['filter'](Boolean),
    ),
  ]['join']('、');
}
function getStoryAssetVisualCompletenessScore(_0x649081 = {}) {
  const _0x1e963e = Array['isArray'](_0x649081?.['appearances']) ? _0x649081['appearances'] : [];
  return _0x1e963e['reduce'](
    (_0x52a70c, _0x50db3e) =>
      _0x52a70c +
      String(_0x50db3e?.['prompt'] || '')['trim']()['length'] +
      String(_0x50db3e?.['description'] || '')['trim']()['length'],
    String(_0x649081?.['description'] || '')['trim']()['length'],
  );
}
export function consolidateDirectStorySceneAssets(_0x2a74df = {}, _0x557288 = []) {
  const _0x70696d = Array['isArray'](_0x2a74df?.['assets']) ? _0x2a74df['assets'] : [],
    _0x5b4c99 = new Map(),
    _0x5046db = [];
  _0x70696d['forEach']((_0x1d4ac8) => {
    if (_0x1d4ac8?.['kind'] !== 'scene') {
      _0x5046db['push']({ type: 'asset', asset: _0x1d4ac8 });
      return;
    }
    const _0x45172c = _0x557288['filter']((_0x49aa2c) =>
        storySceneQualityNamesMatch(_0x1d4ac8?.['name'], _0x49aa2c),
      ),
      _0x30bbb1 = _0x45172c['find'](
        (_0x52589e) => getStorySceneIdentityKey(_0x52589e) === getStorySceneIdentityKey(_0x1d4ac8?.['name']),
      ),
      _0x4c5c0d =
        _0x30bbb1 ||
        (_0x45172c['length'] === 0x1 ? _0x45172c[0x0] : String(_0x1d4ac8?.['name'] || '')['trim']()),
      _0x1c685a = getStorySceneIdentityKey(_0x4c5c0d);
    (!_0x5b4c99['has'](_0x1c685a) &&
      (_0x5b4c99['set'](_0x1c685a, []), _0x5046db['push']({ type: 'scene', key: _0x1c685a })),
      _0x5b4c99['get'](_0x1c685a)['push']({ asset: _0x1d4ac8, canonicalName: _0x4c5c0d }));
  });
  const _0x4524b3 = _0x5046db['flatMap']((_0x7992ea) => {
    if (_0x7992ea['type'] === 'asset') return [_0x7992ea['asset']];
    const _0x5954e8 = _0x5b4c99['get'](_0x7992ea['key']) || [],
      _0x52eebf = [..._0x5954e8]['sort'](
        (_0x4f7efa, _0x17a972) =>
          getStoryAssetVisualCompletenessScore(_0x17a972['asset']) -
          getStoryAssetVisualCompletenessScore(_0x4f7efa['asset']),
      )[0x0];
    if (!_0x52eebf) return [];
    const _0x52d75a = [
        ...new Set(
          _0x5954e8['flatMap'](({ asset: _0x5bee23 }) =>
            Array['isArray'](_0x5bee23?.['sourceChapterIds']) ? _0x5bee23['sourceChapterIds'] : [],
          ),
        ),
      ],
      _0xa9cb99 = new Map(),
      _0x53d6b4 = [];
    _0x5954e8['forEach'](({ asset: _0x41b347 }) => {
      (Array['isArray'](_0x41b347?.['appearances']) ? _0x41b347['appearances'] : [])['forEach'](
        (_0x3c8568) => {
          const _0x2b9d35 = String(_0x3c8568?.['name'] || '')
              ['trim']()
              ['toLowerCase'](),
            _0x23d2f4 = _0x2b9d35 || 'appearance-' + (_0x53d6b4['length'] + 0x1);
          (!_0xa9cb99['has'](_0x23d2f4) && (_0xa9cb99['set'](_0x23d2f4, []), _0x53d6b4['push'](_0x23d2f4)),
            _0xa9cb99['get'](_0x23d2f4)['push'](_0x3c8568));
        },
      );
    });
    const _0x12fafe = _0x53d6b4['map']((_0x18908f) => {
      const _0x457ac4 = _0xa9cb99['get'](_0x18908f) || [],
        _0x2b8dcd = [..._0x457ac4]['sort'](
          (_0x1fd32b, _0x4cda3a) =>
            String(_0x4cda3a?.['prompt'] || '')['trim']()['length'] +
            String(_0x4cda3a?.['description'] || '')['trim']()['length'] -
            String(_0x1fd32b?.['prompt'] || '')['trim']()['length'] -
            String(_0x1fd32b?.['description'] || '')['trim']()['length'],
        )[0x0];
      return {
        ..._0x2b8dcd,
        occurrences: mergeStoryAssetCoverageText(_0x457ac4['map']((_0x355f55) => _0x355f55?.['occurrences'])),
        sourceChapterIds: [
          ...new Set(
            _0x457ac4['flatMap']((_0xb2adfc) =>
              Array['isArray'](_0xb2adfc?.['sourceChapterIds']) ? _0xb2adfc['sourceChapterIds'] : [],
            ),
          ),
        ],
      };
    });
    return [
      {
        ..._0x52eebf['asset'],
        name: _0x52eebf['canonicalName'],
        occurrences: mergeStoryAssetCoverageText(
          _0x5954e8['map'](({ asset: _0x508574 }) => _0x508574?.['occurrences']),
        ),
        sourceChapterIds: _0x52d75a,
        appearances: _0x12fafe,
      },
    ];
  });
  return { ..._0x2a74df, assets: _0x4524b3 };
}
function collectLegacyQuotedStoryProps(
  _0x5e2c2c = [],
  { includeEpisodeTitles: includeEpisodeTitles = ![] } = {},
) {
  const _0x776fbf = [];
  return (
    (Array['isArray'](_0x5e2c2c) ? _0x5e2c2c : [])['forEach']((_0x514dd0) => {
      const _0x58faf6 = String(_0x514dd0?.['body'] || '');
      for (const _0x5927d5 of _0x58faf6['matchAll'](/《([^》\r\n]{1,24})》/gu)) {
        const _0x3cc679 = _0x58faf6['slice'](
          Math['max'](0x0, (_0x5927d5['index'] || 0x0) - 0x28),
          _0x5927d5['index'] || 0x0,
        );
        if (
          !includeEpisodeTitles &&
          /(?:第\s*(?:\d+|[零〇一二三四五六七八九十百千万两廿卅]+)\s*集|(?:episode|ep)\s*\d+)\s*[：:—\-·丨|】\]）)]*\s*$/iu[
            'test'
          ](_0x3cc679)
        )
          continue;
        const _0x19800d = String(_0x5927d5[0x1] || '')['trim']();
        if (_0x19800d && !_0x776fbf['includes'](_0x19800d)) _0x776fbf['push'](_0x19800d);
      }
    }),
    _0x776fbf
  );
}
function createStoryAssetQualityResumeRequirementAliases(_0x3749f0, _0x7fb8c7, _0x104e2d) {
  if (!_0x3749f0) return [];
  const _0x234c62 = Number(_0x3749f0['hybridQualityPolicyVersion']) || 0x0;
  if (_0x234c62 >= STORY_ASSET_HYBRID_QUALITY_POLICY_VERSION) return [];
  const _0x2f1baa = collectLegacyRequiredStoryCharacterNames(_0x104e2d),
    _0xda879b = { ..._0x7fb8c7, character: _0x2f1baa },
    _0x29ca5b = {
      ..._0xda879b,
      scene: collectLegacyRequiredStorySceneNames(_0x104e2d),
      prop: collectLegacyQuotedStoryProps(_0x104e2d),
    },
    _0x1b7355 = {
      ..._0x29ca5b,
      prop: collectLegacyQuotedStoryProps(_0x104e2d, { includeEpisodeTitles: !![] }),
    },
    _0x137623 = JSON['stringify'](_0x7fb8c7),
    _0x3a1739 = new Map();
  return (
    (_0x234c62 >= 0x3 ? [_0xda879b] : _0x234c62 >= 0x2 ? [_0x29ca5b] : [_0x29ca5b, _0x1b7355])['forEach'](
      (_0x4aecfe) => {
        const _0x431a23 = JSON['stringify'](_0x4aecfe);
        if (_0x431a23 !== _0x137623 && !_0x3a1739['has'](_0x431a23)) _0x3a1739['set'](_0x431a23, _0x4aecfe);
      },
    ),
    [..._0x3a1739['values']()]
  );
}
function promptCopiesStorySource(_0x10ffeb = '', _0x261eb0 = []) {
  const _0x7b951e = compactStoryAssetQualityText(_0x10ffeb);
  if (_0x7b951e['length'] < STORY_ASSET_SOURCE_COPY_WINDOW_CHARACTERS) return ![];
  return _0x261eb0['some']((_0x404a98) => {
    const _0x4fe12e = compactStoryAssetQualityText(_0x404a98?.['body']);
    if (_0x4fe12e['length'] < STORY_ASSET_SOURCE_COPY_WINDOW_CHARACTERS) return ![];
    for (
      let _0x2b5a19 = 0x0;
      _0x2b5a19 <= _0x4fe12e['length'] - STORY_ASSET_SOURCE_COPY_WINDOW_CHARACTERS;
      _0x2b5a19 += Math['floor'](STORY_ASSET_SOURCE_COPY_WINDOW_CHARACTERS / 0x2)
    ) {
      const _0x430583 = _0x4fe12e['slice'](_0x2b5a19, _0x2b5a19 + STORY_ASSET_SOURCE_COPY_WINDOW_CHARACTERS);
      if (_0x7b951e['includes'](_0x430583)) return !![];
    }
    return ![];
  });
}
function removeNarrativeUploadFallbackCharacterAssets(
  _0x5e57a2 = {},
  _0x107d2b = {},
  _0x4c1d08 = [],
  _0x17846c = _0x4c1d08,
  { requireVerifiedFallbackCharacters: requireVerifiedFallbackCharacters = ![] } = {},
) {
  const _0x283759 = [
      ...(Array['isArray'](_0x107d2b?.['hardRequired']) ? _0x107d2b['hardRequired'] : []),
      ...(Array['isArray'](_0x107d2b?.['optionalCandidates']) ? _0x107d2b['optionalCandidates'] : []),
    ]['filter'](
      (_0x3e7268) =>
        _0x3e7268?.['kind'] === 'character' &&
        _0x3e7268?.['reasonCodes']?.['includes']('upload-fallback-imported-character'),
    ),
    _0x2351bc = requireVerifiedFallbackCharacters
      ? getUntrustedUploadFallbackStoryCharacterNames(_0x107d2b, _0x4c1d08, _0x17846c)
      : _0x283759['filter']((_0x5648a5) => isNarrativeStoryCharacterFragment(_0x5648a5?.['name']))['map'](
          (_0x314b7b) => _0x314b7b?.['name'],
        ),
    _0x333242 = new Set(_0x2351bc['map'](normalizeStoryAssetQualityName)['filter'](Boolean));
  if (!_0x333242['size']) return _0x5e57a2;
  return {
    ..._0x5e57a2,
    assets: (Array['isArray'](_0x5e57a2?.['assets']) ? _0x5e57a2['assets'] : [])['filter'](
      (_0xf0d9f1) =>
        _0xf0d9f1?.['kind'] !== 'character' ||
        !_0x333242['has'](normalizeStoryAssetQualityName(_0xf0d9f1?.['name'])),
    ),
  };
}
function createHardAuthoritativeSourceScenes(_0x233a29 = [], _0x3bcaec = {}) {
  return (Array['isArray'](_0x233a29) ? _0x233a29 : [])['map']((_0x54e403) => ({
    ..._0x54e403,
    characters: getHardRequiredStoryAssetNamesForScene(_0x3bcaec, 'character', _0x54e403?.['ref']),
  }));
}
export function assertStoryAssetPublicResultQuality(_0x248e10 = {}, _0x1611ee = [], _0x2656e0 = {}) {
  const _0x166bb0 = Array['isArray'](_0x248e10?.['assets']) ? _0x248e10['assets'] : [];
  if (!_0x166bb0['length'])
    throw Object['assign'](new Error('API 没有返回可用资产；旧资产已保留，未进入下一步。'), {
      type: 'ASSET_VISUAL_RESULT_INCOMPLETE',
      validationDetails: { problems: ['API 没有返回可用资产'], kinds: ['character', 'scene', 'prop'] },
    });
  const _0x1dcf8f = [],
    _0x2f44da = new Set(),
    _0x41a8ea = (_0x656862, _0x3eda5e) => {
      _0x1dcf8f['push'](_0x3eda5e);
      if (_0x656862) _0x2f44da['add'](_0x656862);
    },
    _0x25a18f = _0x166bb0['filter']((_0x12f4ed) => _0x12f4ed?.['kind'] === 'character'),
    _0x3629bd = _0x166bb0['filter']((_0x2a36ff) => _0x2a36ff?.['kind'] === 'scene'),
    _0x41dd50 = _0x166bb0['filter']((_0x38de28) => _0x38de28?.['kind'] === 'prop'),
    _0x28d1f2 =
      /客户端|PP-UIE|证据原文|模型细化|统一添加|candidateAssets|本地候选|候选资产|召回候选|召回线索/iu,
    _0x2745e8 =
      /^(?:(?:时间|时长|地点|目的地|状态|场景|镜头|画面|动作|音效|音乐|字幕|备注|人物|角色|台词|环境|转场)|(?:然后|随后|接着|紧接着|这时|此时)(?:他|她|它)?.*|.*(?:若干|数人|多人|等人))$/u,
    _0x3fe4f8 = new Set();
  _0x25a18f['forEach']((_0x4adf4f) => {
    const _0x56c1b7 = String(_0x4adf4f?.['name'] || '')['trim'](),
      _0x449f6e = normalizeStoryAssetQualityName(_0x56c1b7);
    _0x449f6e &&
      _0x3fe4f8['has'](_0x449f6e) &&
      _0x41a8ea('character', '重复角色“' + (_0x56c1b7 || '未命名角色') + '”');
    if (_0x449f6e) _0x3fe4f8['add'](_0x449f6e);
    (isNarrativeStoryCharacterFragment(_0x56c1b7) || _0x2745e8['test'](_0x56c1b7)) &&
      _0x41a8ea('character', '明显非人物角色“' + (_0x56c1b7 || '未命名角色') + '”');
  });
  const _0x2ec264 = new Set();
  _0x41dd50['forEach']((_0x5f2f3e) => {
    const _0x12deb1 = String(_0x5f2f3e?.['name'] || '')['trim'](),
      _0x4f193d = normalizeStoryAssetQualityName(_0x12deb1);
    _0x4f193d &&
      _0x2ec264['has'](_0x4f193d) &&
      _0x41a8ea('prop', '重复道具“' + (_0x12deb1 || '未命名道具') + '”');
    if (_0x4f193d) _0x2ec264['add'](_0x4f193d);
  });
  const _0x2cc764 = new Set();
  (_0x3629bd['forEach']((_0x1ed93b) => {
    const _0x64afda = getStorySceneIdentityKey(_0x1ed93b?.['name']);
    _0x64afda &&
      _0x2cc764['has'](_0x64afda) &&
      _0x41a8ea('scene', '重复场景“' + (_0x1ed93b?.['name'] || '未命名场景') + '”');
    if (_0x64afda) _0x2cc764['add'](_0x64afda);
  }),
    (_0x2656e0?.['character'] || [])['forEach']((_0x46bac6) => {
      !_0x25a18f['some']((_0x107403) => storyCharacterQualityNamesMatch(_0x107403?.['name'], _0x46bac6)) &&
        _0x41a8ea('character', '缺少原文角色“' + _0x46bac6 + '”');
    }));
  const _0x221e93 = new Map(),
    _0x5a86d5 = _0x2656e0?.['scene'] || [],
    _0x56afbf = (_0x1ae31a, _0xf246a2) => {
      const _0x2acea4 = _0x5a86d5[_0x1ae31a],
        _0x5bc28a = getStorySceneQualitySourceRefs(_0x2acea4, _0x1611ee),
        _0x48c9c9 = _0x3629bd['map']((_0x2eaf96, _0x5f1ddd) => ({ asset: _0x2eaf96, assetIndex: _0x5f1ddd }))
          ['filter'](
            ({ asset: _0x108618 }) =>
              storySceneQualityNamesMatch(_0x108618?.['name'], _0x2acea4) ||
              (Array['isArray'](_0x108618?.['sourceSceneRefs']) &&
                _0x108618['sourceSceneRefs']['some']((_0x595691) => _0x5bc28a['has'](_0x595691))),
          )
          ['sort']((_0x550da0, _0x41135c) => {
            const _0x5e54df =
                getStorySceneIdentityKey(_0x550da0['asset']?.['name']) ===
                getStorySceneIdentityKey(_0x2acea4),
              _0x594c49 =
                getStorySceneIdentityKey(_0x41135c['asset']?.['name']) ===
                getStorySceneIdentityKey(_0x2acea4);
            return Number(_0x594c49) - Number(_0x5e54df);
          })
          ['map'](({ assetIndex: _0x34dbae }) => _0x34dbae);
      for (const _0xec4ebb of _0x48c9c9) {
        if (_0xf246a2['has'](_0xec4ebb)) continue;
        _0xf246a2['add'](_0xec4ebb);
        const _0x2266af = _0x221e93['get'](_0xec4ebb);
        if (_0x2266af === undefined || _0x56afbf(_0x2266af, _0xf246a2))
          return (_0x221e93['set'](_0xec4ebb, _0x1ae31a), !![]);
      }
      return ![];
    };
  (_0x5a86d5['forEach']((_0x1fdc99, _0x37e235) => {
    !_0x56afbf(_0x37e235, new Set()) && _0x41a8ea('scene', '缺少原子场景“' + _0x1fdc99 + '”');
  }),
    (_0x2656e0?.['prop'] || [])['forEach']((_0x6451ef) => {
      !_0x41dd50['some']((_0x102b66) => storyPropQualityRequirementMatches(_0x102b66, _0x6451ef)) &&
        _0x41a8ea('prop', '缺少原文关键道具“' + _0x6451ef + '”');
    }),
    _0x166bb0['forEach']((_0x1e851f) => {
      [
        _0x1e851f?.['name'],
        _0x1e851f?.['description'],
        _0x1e851f?.['voiceDescription'],
        _0x1e851f?.['occurrences'],
      ]['forEach']((_0x18b6f2) => {
        _0x28d1f2['test'](String(_0x18b6f2 || '')) &&
          _0x41a8ea(_0x1e851f?.['kind'], (_0x1e851f?.['name'] || '未命名资产') + '描述泄露了内部处理规则');
      });
      _0x1e851f?.['designStatus'] === 'baseline' &&
        _0x41a8ea(_0x1e851f?.['kind'], (_0x1e851f?.['name'] || '未命名资产') + '缺少\x20API\x20视觉反推');
      _0x1e851f?.['kind'] === 'scene' &&
        /[/／|｜]/u['test'](String(_0x1e851f?.['name'] || '')) &&
        _0x41a8ea('scene', _0x1e851f['name'] + '仍是复合场景名');
      const _0x594723 = Array['isArray'](_0x1e851f?.['appearances']) ? _0x1e851f['appearances'] : [];
      (!_0x594723['length'] &&
        _0x41a8ea(_0x1e851f?.['kind'], (_0x1e851f?.['name'] || '未命名资产') + '缺少形象'),
        _0x594723['forEach']((_0x339072) => {
          [_0x339072?.['name'], _0x339072?.['description'], _0x339072?.['occurrences']]['forEach'](
            (_0x57df0c) => {
              _0x28d1f2['test'](String(_0x57df0c || '')) &&
                _0x41a8ea(
                  _0x1e851f?.['kind'],
                  (_0x1e851f?.['name'] || '未命名资产') + '形象描述泄露了内部处理规则',
                );
            },
          );
          const _0x2b12b2 = String(_0x339072?.['prompt'] || '')['trim']();
          if (!_0x2b12b2)
            _0x41a8ea(_0x1e851f?.['kind'], (_0x1e851f?.['name'] || '未命名资产') + '缺少图片提示词');
          else {
            if (_0x2b12b2['length'] > STORY_ASSET_PUBLIC_PROMPT_MAX_CHARACTERS)
              _0x41a8ea(_0x1e851f?.['kind'], (_0x1e851f?.['name'] || '未命名资产') + '提示词异常过长');
            else {
              if (promptCopiesStorySource(_0x2b12b2, _0x1611ee))
                _0x41a8ea(
                  _0x1e851f?.['kind'],
                  (_0x1e851f?.['name'] || '未命名资产') + '提示词复制了大段剧情原文',
                );
              else
                _0x28d1f2['test'](_0x2b12b2) &&
                  _0x41a8ea(
                    _0x1e851f?.['kind'],
                    (_0x1e851f?.['name'] || '未命名资产') + '提示词泄露了内部处理规则',
                  );
            }
          }
        }));
    }));
  if (!_0x1dcf8f['length']) return;
  const _0x2af936 = new Error(
    'API 视觉反推质量校验未通过：' +
      _0x1dcf8f['slice'](0x0, 0x3)['join']('；') +
      '。旧资产已保留，未进入下一步。',
  );
  ((_0x2af936['type'] = 'ASSET_VISUAL_QUALITY'),
    (_0x2af936['validationDetails'] = { problems: _0x1dcf8f, kinds: [..._0x2f44da] }));
  throw _0x2af936;
}
async function checkpointStoryAssetQualityFailure(_0x477f13, _0x2284f1, _0x2c6dc5) {
  if (!_0x2284f1 || typeof _0x2284f1 !== 'object') return;
  const _0xaed5ac = cloneValue(_0x2284f1);
  _0xaed5ac['hybridQualityPolicyVersion'] = STORY_ASSET_HYBRID_QUALITY_POLICY_VERSION;
  const _0x155742 = Array['isArray'](_0x477f13?.['validationDetails']?.['kinds'])
      ? _0x477f13['validationDetails']['kinds']
      : [],
    _0x3aaf5f = _0x155742['length'] ? _0x155742 : ['character', 'scene', 'prop'],
    _0x29df6d =
      _0xaed5ac['strategy'] === STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY
        ? getStoryAssetProtectedPaidBatchKeys(_0xaed5ac)
        : [];
  ((_0xaed5ac['qualityReview'] = {
    schemaVersion: STORY_ASSET_QUALITY_REVIEW_SCHEMA_VERSION,
    status: 'blocked',
    policyVersion: STORY_ASSET_HYBRID_QUALITY_POLICY_VERSION,
    recoveryMode: STORY_ASSET_QUALITY_RECOVERY_PAID_RERUN,
    kinds: _0x3aaf5f,
    ...(_0x29df6d['length'] ? { batchIds: _0x29df6d } : {}),
    problems: Array['isArray'](_0x477f13?.['validationDetails']?.['problems'])
      ? [..._0x477f13['validationDetails']['problems']]
      : [],
    message: String(_0x477f13?.['message'] || '结果校验失败'),
    reviewedAt: Date['now'](),
  }),
    (_0xaed5ac['status'] = 'blocked'),
    (_0xaed5ac['kindStates'] =
      _0xaed5ac['kindStates'] && typeof _0xaed5ac['kindStates'] === 'object' ? _0xaed5ac['kindStates'] : {}),
    _0x3aaf5f['forEach']((_0x340b26) => {
      _0xaed5ac['kindStates'][_0x340b26] = {
        ...(_0xaed5ac['kindStates'][_0x340b26] || {}),
        kind: _0x340b26,
        status: 'blocked-quality-rerun',
        errorType: 'quality-rerun-required',
        errorMessage: '已付费结果未通过当前视觉质量合同；需要用户明确授权后重新请求该通道。',
        finishedAt: Date['now'](),
      };
    }),
    _0x29df6d['forEach']((_0x1ebaf9) => {
      const _0x13c5ef = _0xaed5ac['batchSubmissionRecords']?.[_0x1ebaf9];
      if (!_0x13c5ef) return;
      ((_0x13c5ef['qualityPreviousStatus'] = _0x13c5ef['status']),
        (_0x13c5ef['status'] = 'blocked-quality-rerun'),
        (_0x13c5ef['errorType'] = 'quality-rerun-required'),
        (_0x13c5ef['errorMessage'] = '已付费结果未通过当前视觉质量合同；需要用户逐批明确授权后重新请求。'),
        (_0x13c5ef['blockedAt'] = Date['now']()));
    }),
    (_0xaed5ac['completedKinds'] = ['character', 'scene', 'prop']['filter'](
      (_0x916c1c) => _0xaed5ac['kindStates']?.[_0x916c1c]?.['status'] === 'succeeded',
    )),
    (_0xaed5ac['failures'] = _0x3aaf5f['map']((_0x11040f) => ({
      stage: 'quality',
      kind: _0x11040f,
      errorType: 'quality-rerun-required',
      errorMessage: '已付费结果未通过当前视觉质量合同；需要用户明确授权后重新请求。',
    }))),
    (_0xaed5ac['updatedAt'] = Date['now']()),
    (_0x477f13['assetExtractionDraft'] = cloneValue(_0xaed5ac)),
    await _0x2c6dc5?.(_0xaed5ac));
}
function prepareLegacyStoryAssetQualityRevalidationDraft(_0x346742) {
  const _0x41d737 = cloneValue(_0x346742);
  if (!_0x41d737) return _0x346742;
  let _0x4fd4df = ![];
  _0x41d737['qualityReview'] && (delete _0x41d737['qualityReview'], (_0x4fd4df = !![]));
  let _0xe17550 = 0x0;
  ['character', 'scene', 'prop']['forEach']((_0x6d8687) => {
    const _0x1a36e4 = _0x41d737?.['kindStates']?.[_0x6d8687],
      _0x1b7804 = _0x41d737?.['assetsByKind']?.[_0x6d8687],
      _0x54c838 = Array['isArray'](_0x41d737?.['completedAssets'])
        ? _0x41d737['completedAssets']['filter']((_0x1b8ad4) => _0x1b8ad4?.['kind'] === _0x6d8687)
        : [];
    if (
      _0x41d737?.['strategy'] === STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY &&
      _0x1a36e4?.['status'] === 'blocked-quality-rerun' &&
      _0x54c838['length']
    ) {
      ((_0x41d737['kindStates'][_0x6d8687] = {
        ..._0x1a36e4,
        status: 'succeeded',
        assetCount: _0x54c838['length'],
        totalAssetCount: _0x54c838['length'],
        errorType: '',
        errorMessage: '',
      }),
        (_0xe17550 += 0x1));
      return;
    }
    if (
      _0x1a36e4?.['status'] !== 'failed' ||
      _0x1a36e4?.['errorType'] !== 'validation' ||
      !Array['isArray'](_0x1b7804)
    )
      return;
    ((_0x41d737['kindStates'][_0x6d8687] = {
      ..._0x1a36e4,
      status: 'succeeded',
      assetCount: _0x1b7804['length'],
      errorType: '',
      errorMessage: '',
    }),
      (_0xe17550 += 0x1));
  });
  if (!_0xe17550 && !_0x4fd4df) return _0x346742;
  return (
    (_0x41d737['hybridQualityPolicyVersion'] = STORY_ASSET_HYBRID_QUALITY_POLICY_VERSION),
    (_0x41d737['completedKinds'] = ['character', 'scene', 'prop']['filter'](
      (_0x1801bb) => _0x41d737['kindStates']?.[_0x1801bb]?.['status'] === 'succeeded',
    )),
    _0x41d737?.['strategy'] === STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY
      ? Object['values'](_0x41d737['batchSubmissionRecords'] || {})['forEach']((_0x432245) => {
          _0x432245?.['status'] === 'blocked-quality-rerun' &&
            String(_0x432245?.['qualityPreviousStatus'] || '')['trim']() &&
            ((_0x432245['status'] = _0x432245['qualityPreviousStatus']),
            delete _0x432245['qualityPreviousStatus'],
            delete _0x432245['errorType'],
            delete _0x432245['errorMessage'],
            delete _0x432245['blockedAt']);
        })
      : (_0x41d737['completedAssets'] = ['character', 'scene', 'prop']['flatMap'](
          (_0x23aea3) => _0x41d737['assetsByKind']?.[_0x23aea3] || [],
        )),
    (_0x41d737['failures'] = []),
    (_0x41d737['status'] = _0x41d737['completedKinds']['length'] === 0x3 ? 'completed' : 'partial'),
    _0x41d737
  );
}
function isCurrentStoryAssetPaidQualityReview(_0x1a758e) {
  return Boolean(
    Number(_0x1a758e?.['qualityReview']?.['schemaVersion']) >= STORY_ASSET_QUALITY_REVIEW_SCHEMA_VERSION &&
    Number(_0x1a758e?.['qualityReview']?.['policyVersion']) === STORY_ASSET_HYBRID_QUALITY_POLICY_VERSION &&
    _0x1a758e?.['qualityReview']?.['recoveryMode'] === STORY_ASSET_QUALITY_RECOVERY_PAID_RERUN,
  );
}
function archiveAndResetStoryAssetQualityLane(_0x3d1518, _0x49079e) {
  _0x3d1518['paidResponseHistoryByKind'] =
    _0x3d1518['paidResponseHistoryByKind'] && typeof _0x3d1518['paidResponseHistoryByKind'] === 'object'
      ? _0x3d1518['paidResponseHistoryByKind']
      : {};
  const _0x56b684 = Array['isArray'](_0x3d1518['paidResponseHistoryByKind'][_0x49079e])
    ? _0x3d1518['paidResponseHistoryByKind'][_0x49079e]
    : [];
  (_0x56b684['push']({
    archivedAt: Date['now'](),
    reason: 'authorized-quality-rerun',
    rawResponse: Object['hasOwn'](_0x3d1518?.['rawResponsesByKind'] || {}, _0x49079e)
      ? _0x3d1518['rawResponsesByKind'][_0x49079e]
      : '',
    responseMode: _0x3d1518?.['rawResponseModesByKind']?.[_0x49079e] || '',
    contractSnapshot: cloneValue(_0x3d1518?.['rawResponseContractSnapshotsByKind']?.[_0x49079e]),
    decisions: cloneValue(_0x3d1518?.['decisionsByKind']?.[_0x49079e]),
    assets: cloneValue(_0x3d1518?.['assetsByKind']?.[_0x49079e] || []),
    submissionState: cloneValue(_0x3d1518?.['submissionStatesByKind']?.[_0x49079e]),
    kindState: cloneValue(_0x3d1518?.['kindStates']?.[_0x49079e]),
  }),
    (_0x3d1518['paidResponseHistoryByKind'][_0x49079e] = _0x56b684),
    (_0x3d1518['assetsByKind'][_0x49079e] = []),
    delete _0x3d1518['rawResponsesByKind'][_0x49079e],
    delete _0x3d1518['rawResponseModesByKind'][_0x49079e],
    delete _0x3d1518['rawResponseContractSnapshotsByKind'][_0x49079e],
    delete _0x3d1518['paidResponseReceivedByKind'][_0x49079e],
    delete _0x3d1518['decisionsByKind'][_0x49079e],
    delete _0x3d1518['submissionStatesByKind'][_0x49079e],
    (_0x3d1518['kindStates'][_0x49079e] = {
      ...(_0x3d1518['kindStates'][_0x49079e] || {}),
      kind: _0x49079e,
      status: 'pending',
      assetCount: 0x0,
      errorType: '',
      errorMessage: '',
      finishedAt: 0x0,
    }));
}
function archiveAndResetStoryAssetQualityBatches(_0x33e995, _0x588966) {
  ((_0x33e995['paidBatchHistory'] =
    _0x33e995['paidBatchHistory'] && typeof _0x33e995['paidBatchHistory'] === 'object'
      ? _0x33e995['paidBatchHistory']
      : {}),
    _0x588966['forEach']((_0x1205bc) => {
      const _0x391e66 = _0x33e995['batchSubmissionRecords']?.[_0x1205bc];
      if (!_0x391e66) return;
      const _0x23acd4 = Array['isArray'](_0x33e995['paidBatchHistory'][_0x1205bc])
        ? _0x33e995['paidBatchHistory'][_0x1205bc]
        : [];
      (_0x23acd4['push']({
        ...cloneValue(_0x391e66),
        archivedAt: Date['now'](),
        archiveReason: 'authorized-quality-rerun',
      }),
        (_0x33e995['paidBatchHistory'][_0x1205bc] = _0x23acd4));
    }),
    (_0x33e995['status'] = 'pending'),
    (_0x33e995['phase'] = 'inventory'),
    (_0x33e995['inventoryBatches'] = []),
    (_0x33e995['inventory'] = null),
    (_0x33e995['completedAssets'] = []),
    (_0x33e995['detailBatches'] = []),
    (_0x33e995['batchSubmissionRecords'] = {}),
    (_0x33e995['failures'] = []),
    (_0x33e995['runRequestCount'] = 0x0),
    delete _0x33e995['kindStates'],
    delete _0x33e995['progress']);
}
function createStoryAssetQualityRerunRequiredError(_0x4382ac, _0x58b298, _0x1e5ed7) {
  const _0x37767d = new Error('已付费结果未通过视觉质量合同；未获得精确授权，未自动重新请求。');
  return (
    (_0x37767d['type'] = 'ASSET_VISUAL_QUALITY_RERUN_REQUIRED'),
    (_0x37767d['blockedKinds'] = [..._0x58b298]),
    (_0x37767d['blockedBatchIds'] = [..._0x1e5ed7]),
    (_0x37767d['assetExtractionDraft'] = cloneValue(_0x4382ac)),
    _0x37767d
  );
}
async function prepareStoryAssetQualityRecoveryDraft(_0x4fa73e, _0x19f63e, _0x4a14cf) {
  if (!_0x4fa73e?.['qualityReview']) return _0x4fa73e;
  if (!isCurrentStoryAssetPaidQualityReview(_0x4fa73e))
    return prepareLegacyStoryAssetQualityRevalidationDraft(_0x4fa73e);
  const _0x5a9fe3 = cloneValue(_0x4fa73e),
    _0x4e6436 =
      Array['isArray'](_0x5a9fe3['qualityReview']?.['kinds']) && _0x5a9fe3['qualityReview']['kinds']['length']
        ? _0x5a9fe3['qualityReview']['kinds']
        : ['character', 'scene', 'prop'],
    _0x4c8102 =
      _0x5a9fe3['strategy'] === STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY
        ? Array['isArray'](_0x5a9fe3['qualityReview']?.['batchIds'])
          ? _0x5a9fe3['qualityReview']['batchIds']
          : getStoryAssetProtectedPaidBatchKeys(_0x5a9fe3)
        : [],
    _0x5d610d =
      _0x5a9fe3['strategy'] === STORY_ASSET_PARALLEL_DRAFT_STRATEGY
        ? _0x4e6436['filter']((_0x1317fc) => !isStoryAssetPaidLaneRerunAuthorized(_0x19f63e, _0x1317fc))
        : [],
    _0x205be7 =
      _0x5a9fe3['strategy'] === STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY
        ? _0x4c8102['filter']((_0x2d80ef) => !isStoryAssetPaidBatchRerunAuthorized(_0x19f63e, _0x2d80ef))
        : [];
  if (_0x5d610d['length'] || _0x205be7['length'])
    throw createStoryAssetQualityRerunRequiredError(
      _0x5a9fe3,
      _0x5d610d['length'] ? _0x5d610d : _0x4e6436,
      _0x205be7['length'] ? _0x205be7 : _0x4c8102,
    );
  if (_0x5a9fe3['strategy'] === STORY_ASSET_PARALLEL_DRAFT_STRATEGY)
    _0x4e6436['forEach']((_0x58f030) => {
      archiveAndResetStoryAssetQualityLane(_0x5a9fe3, _0x58f030);
    });
  else
    _0x5a9fe3['strategy'] === STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY &&
      archiveAndResetStoryAssetQualityBatches(_0x5a9fe3, _0x4c8102);
  const _0x1c78cd = Array['isArray'](_0x5a9fe3['qualityReviewHistory'])
    ? _0x5a9fe3['qualityReviewHistory']
    : [];
  return (
    _0x1c78cd['push']({
      ...cloneValue(_0x5a9fe3['qualityReview']),
      recoveredAt: Date['now'](),
      recoveryReason: 'authorized-quality-rerun',
    }),
    (_0x5a9fe3['qualityReviewHistory'] = _0x1c78cd),
    delete _0x5a9fe3['qualityReview'],
    (_0x5a9fe3['updatedAt'] = Date['now']()),
    await _0x4a14cf?.(cloneValue(_0x5a9fe3)),
    _0x5a9fe3
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
  ..._0x411d9b
} = {}) {
  const _0xf94a0f = normalizeStoryAssetExtractionSources(episodes),
    _0x772aa1 = createStoryAssetRequirementEvidencePlan(_0xf94a0f),
    _0x3ad0fe = {
      character: getHardRequiredStoryAssetNames(_0x772aa1, 'character'),
      scene: collectRequiredStorySceneNames(_0x772aa1),
      prop: getHardRequiredStoryAssetNames(_0x772aa1, 'prop'),
    },
    _0x3d8029 = createStoryAssetRequiredContractsByKind({
      project: project,
      requirementEvidence: _0x772aa1,
      sourceScenes: _0xf94a0f,
      requiredAssetNamesByKind: _0x3ad0fe,
    }),
    _0x3895a1 = createStoryAssetAuthoritativeSourceFingerprint(_0xf94a0f),
    _0x4be53d = String(resumeDraft?.['hybridAuthoritativeSourceFingerprint'] || '')['trim'](),
    _0x381936 = Boolean(_0x4be53d && _0x4be53d !== _0x3895a1),
    _0x6eed6b = Boolean(
      _0x381936 &&
      Number(resumeDraft?.['hybridQualityPolicyVersion']) >= 0x5 &&
      Number(resumeDraft?.['hybridQualityPolicyVersion']) <= STORY_ASSET_HYBRID_QUALITY_POLICY_VERSION &&
      hasSameStoryAssetAuthoritativeContent(resumeDraft?.['hybridEvidenceScenes'], _0xf94a0f),
    ),
    _0x24e84c = Boolean(_0x381936 && !_0x6eed6b);
  _0x6eed6b &&
    reportDiagnostics(diagnostics, 'story-asset-hybrid-resume', {
      status: 'compatibility-migration',
      reason: 'derived-character-normalization-drift',
    });
  const _0x53af38 = _0x411d9b?.['paidRerunAuthorization'],
    _0x48027b =
      _0x24e84c && resumeDraft?.['strategy'] === STORY_ASSET_PARALLEL_DRAFT_STRATEGY
        ? getStoryAssetPaidDraftKinds(resumeDraft)
        : [],
    _0x5e88aa =
      _0x24e84c && resumeDraft?.['strategy'] === STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY
        ? getStoryAssetProtectedPaidBatchKeys(resumeDraft)
        : [],
    _0xdd81b7 = _0x48027b['filter'](
      (_0x4099c7) => !isStoryAssetPaidLaneRerunAuthorized(_0x53af38, _0x4099c7),
    ),
    _0x37626e = _0x5e88aa['filter'](
      (_0x53afe3) => !isStoryAssetPaidBatchRerunAuthorized(_0x53af38, _0x53afe3),
    );
  if (_0xdd81b7['length'] || _0x37626e['length']) {
    const _0x19bac5 = cloneValue(resumeDraft);
    ((_0x19bac5['status'] = 'blocked'),
      (_0x19bac5['hybridSourceChangeReview'] = {
        status: 'blocked',
        reason: 'authoritative-source-changed',
        previousSourceFingerprint: _0x4be53d,
        nextSourceFingerprint: _0x3895a1,
        paidKinds: _0x48027b,
        unauthorizedKinds: _0xdd81b7,
        paidBatchKeys: _0x5e88aa,
        unauthorizedBatchKeys: _0x37626e,
      }),
      (_0x19bac5['kindStates'] =
        _0x19bac5['kindStates'] && typeof _0x19bac5['kindStates'] === 'object'
          ? _0x19bac5['kindStates']
          : {}),
      _0xdd81b7['forEach']((_0x360b52) => {
        _0x19bac5['kindStates'][_0x360b52] = {
          ...(_0x19bac5['kindStates'][_0x360b52] || {}),
          kind: _0x360b52,
          status: 'blocked-source-changed',
          errorType: 'authoritative-source-changed',
          errorMessage: '剧本权威正文已变化；需要用户明确授权后才能重新提交该付费通道。',
        };
      }),
      (_0x19bac5['batchSubmissionRecords'] =
        _0x19bac5['batchSubmissionRecords'] && typeof _0x19bac5['batchSubmissionRecords'] === 'object'
          ? _0x19bac5['batchSubmissionRecords']
          : {}),
      _0x37626e['forEach']((_0x474610) => {
        const _0x28fb29 = _0x19bac5['batchSubmissionRecords'][_0x474610];
        if (!_0x28fb29) return;
        (_0x28fb29['status'] !== 'blocked-incompatible' &&
          (_0x28fb29['incompatiblePreviousStatus'] = _0x28fb29['status']),
          (_0x28fb29['status'] = 'blocked-incompatible'),
          (_0x28fb29['errorType'] = 'authoritative-source-changed'),
          (_0x28fb29['errorMessage'] = '剧本权威正文已变化；需要逐批明确授权后才能重新提交该付费批次。'),
          (_0x28fb29['blockedAt'] = Date['now']()));
      }),
      (_0x19bac5['failures'] = _0xdd81b7['map']((_0xce539b) => ({
        stage: 'kind',
        kind: _0xce539b,
        errorType: 'authoritative-source-changed',
        errorMessage: '剧本权威正文已变化；需要用户明确授权后才能重新提交该付费通道。',
      }))),
      (_0x19bac5['updatedAt'] = Date['now']()),
      await onCheckpoint?.(_0x19bac5));
    const _0x2a175c = new Error('剧本权威正文已变化；已有付费提交未获得精确授权，未自动重新请求。');
    ((_0x2a175c['type'] = 'ASSET_AUTHORITATIVE_SOURCE_CHANGED'),
      (_0x2a175c['blockedKinds'] = _0xdd81b7),
      (_0x2a175c['blockedBatchIds'] = _0x37626e),
      (_0x2a175c['assetExtractionDraft'] = cloneValue(_0x19bac5)));
    throw _0x2a175c;
  }
  if (_0x24e84c && _0x48027b['length']) {
    const _0x213dcb = Array['isArray'](resumeDraft?.['hybridPaidSourceHistory'])
        ? cloneValue(resumeDraft['hybridPaidSourceHistory'])
        : [],
      _0x186916 = [
        ..._0x213dcb,
        createStoryAssetSourceChangePaidHistoryEntry(resumeDraft, _0x48027b, _0x4be53d, _0x3895a1),
      ],
      _0x1f6c2e = onCheckpoint;
    onCheckpoint = async (_0x1ad9ca) => {
      await _0x1f6c2e?.({ ..._0x1ad9ca, hybridPaidSourceHistory: cloneValue(_0x186916) });
    };
  }
  if (_0x24e84c && _0x5e88aa['length']) {
    const _0x5b3a2d = cloneValue(resumeDraft?.['paidBatchHistory'] || {});
    _0x5e88aa['forEach']((_0x122830) => {
      const _0x136763 = Array['isArray'](_0x5b3a2d[_0x122830]) ? _0x5b3a2d[_0x122830] : [];
      (_0x136763['push']({
        ...cloneValue(resumeDraft?.['batchSubmissionRecords']?.[_0x122830]),
        archivedAt: Date['now'](),
        archiveReason: 'authorized-authoritative-source-change-rerun',
        previousSourceFingerprint: _0x4be53d,
        nextSourceFingerprint: _0x3895a1,
      }),
        (_0x5b3a2d[_0x122830] = _0x136763));
    });
    const _0x73db7f = onCheckpoint;
    onCheckpoint = async (_0x48403e) => {
      const _0x19bc99 =
          _0x48403e?.['paidBatchHistory'] && typeof _0x48403e['paidBatchHistory'] === 'object'
            ? _0x48403e['paidBatchHistory']
            : {},
        _0xacf54d = cloneValue(_0x5b3a2d);
      (Object['entries'](_0x19bc99)['forEach'](([_0x3187c6, _0x591e72]) => {
        _0xacf54d[_0x3187c6] = [
          ...(Array['isArray'](_0xacf54d[_0x3187c6]) ? _0xacf54d[_0x3187c6] : []),
          ...(Array['isArray'](_0x591e72) ? cloneValue(_0x591e72) : []),
        ];
      }),
        await _0x73db7f?.({ ..._0x48403e, paidBatchHistory: _0xacf54d }));
    };
  }
  let _0x21be0b = _0x24e84c ? null : resumeDraft;
  _0x21be0b = await prepareStoryAssetQualityRecoveryDraft(_0x21be0b, _0x53af38, onCheckpoint);
  _0x24e84c &&
    reportDiagnostics(diagnostics, 'story-asset-hybrid-resume', {
      status: 'invalidated',
      reason: 'authoritative-source-changed',
    });
  const _0x156c2b = async ({
      extractionMode: _0x402d5d,
      localRuntime: localRuntime = null,
      candidateInventory: candidateInventory = null,
      capacityError: _0x426bb1,
    }) => {
      const _0x246399 =
          _0x21be0b?.['strategy'] === STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY &&
          Array['isArray'](_0x21be0b?.['hybridEvidenceScenes']) &&
          _0x21be0b['hybridEvidenceScenes']['length']
            ? cloneValue(_0x21be0b['hybridEvidenceScenes'])
            : _0xf94a0f,
        _0x135213 = Boolean(_0x21be0b?.['strategy'] === STORY_ASSET_PARALLEL_DRAFT_STRATEGY),
        _0x3c609a = _0x135213 ? getStoryAssetPaidDraftKinds(_0x21be0b) : [],
        _0x5ef4a3 = _0x3c609a['filter'](
          (_0x3f33e1) => !isStoryAssetPaidLaneRerunAuthorized(_0x53af38, _0x3f33e1),
        );
      if (_0x5ef4a3['length']) {
        const _0x42ce79 = cloneValue(_0x21be0b);
        ((_0x42ce79['status'] = 'blocked'),
          (_0x42ce79['hybridCapacityReview'] = {
            status: 'blocked',
            reason: 'parallel-contract-over-capacity',
            paidKinds: _0x3c609a,
            unauthorizedKinds: _0x5ef4a3,
            capacityDetails: cloneValue(_0x426bb1?.['capacityDetails']),
          }),
          (_0x42ce79['kindStates'] =
            _0x42ce79['kindStates'] && typeof _0x42ce79['kindStates'] === 'object'
              ? _0x42ce79['kindStates']
              : {}),
          _0x5ef4a3['forEach']((_0x45d9f5) => {
            _0x42ce79['kindStates'][_0x45d9f5] = {
              ...(_0x42ce79['kindStates']?.[_0x45d9f5] || {}),
              kind: _0x45d9f5,
              status: 'blocked-incompatible',
              errorType: 'capacity-strategy-incompatible',
              errorMessage:
                '当前完整输出合同需要切换到证据分批链；需要用户明确授权后才能重新提交该付费通道。',
            };
          }),
          (_0x42ce79['updatedAt'] = Date['now']()),
          await onCheckpoint?.(_0x42ce79));
        const _0x5ab490 = new Error(
          '完整输出合同超过单路安全容量；' + _0x5ef4a3['join']('、') + '已有付费结果，未自动切换并重新请求。',
        );
        ((_0x5ab490['type'] = 'ASSET_CONTRACT_INCOMPATIBLE'),
          (_0x5ab490['blockedKinds'] = _0x5ef4a3),
          (_0x5ab490['assetExtractionDraft'] = cloneValue(_0x42ce79)));
        throw _0x5ab490;
      }
      reportDiagnostics(diagnostics, 'story-asset-hybrid-capacity-route', {
        status: 'started',
        extractionMode: _0x402d5d,
        ...(_0x426bb1?.['capacityDetails'] || {}),
        requestLimit: 0x3,
      });
      const _0x3e51d9 =
        _0x135213 && _0x3c609a['length']
          ? [
              ...(Array['isArray'](_0x21be0b?.['hybridPaidStrategyHistory'])
                ? cloneValue(_0x21be0b['hybridPaidStrategyHistory'])
                : []),
              {
                ...createStoryAssetSourceChangePaidHistoryEntry(
                  _0x21be0b,
                  _0x3c609a,
                  _0x21be0b?.['hybridAuthoritativeSourceFingerprint'] || '',
                  _0x3895a1,
                ),
                reason: 'authorized-capacity-strategy-rerun',
                capacityDetails: cloneValue(_0x426bb1?.['capacityDetails']),
              },
            ]
          : null;
      let _0x5a7228 = null;
      const _0x4adc72 = async (_0x2d8708) => {
        const _0x1759ab = {
          ..._0x2d8708,
          hybridQualityPolicyVersion: STORY_ASSET_HYBRID_QUALITY_POLICY_VERSION,
          hybridExtractionMode: _0x402d5d,
          hybridCapacityFallback: {
            strategy: 'evidence-batched-api',
            requestLimit: 0x3,
            capacityDetails: cloneValue(_0x426bb1?.['capacityDetails']),
          },
          hybridEvidenceScenes: cloneValue(_0x246399),
          hybridLocalRuntime: localRuntime || _0x2d8708?.['hybridLocalRuntime'] || null,
          ...(candidateInventory ? { hybridCandidateInventory: cloneValue(candidateInventory) } : {}),
          ...(_0x3e51d9 ? { hybridPaidStrategyHistory: cloneValue(_0x3e51d9) } : {}),
          hybridAuthoritativeSourceFingerprint: _0x3895a1,
        };
        ((_0x5a7228 = cloneValue(_0x1759ab)), await onCheckpoint?.(_0x1759ab));
      };
      let _0xbfeddd = null;
      try {
        _0xbfeddd = await extractStoryAssetsEvidenceBatched({
          ..._0x411d9b,
          project: project,
          episodes: episodes,
          sourceScenes: _0x246399,
          authoritativeSourceScenes: createHardAuthoritativeSourceScenes(_0xf94a0f, _0x772aa1),
          diagnostics: diagnostics,
          onProgress: onProgress,
          resumeDraft: _0x135213 ? null : _0x21be0b,
          allowLocalBaselineFallback: ![],
          requestLimit: 0x3,
          onCheckpoint: _0x4adc72,
        });
      } catch (_0x3882ab) {
        _0x5a7228 &&
          [
            'ASSET_EXTRACTION_CONTINUE_REQUIRED',
            'ASSET_SUBMISSION_AMBIGUOUS',
            'ASSET_PAID_RESULT_BLOCKED',
            'ASSET_CONTRACT_INCOMPATIBLE',
          ]['includes'](_0x3882ab?.['type']) &&
          (_0x3882ab['assetExtractionDraft'] = {
            ...cloneValue(_0x5a7228),
            ...cloneValue(_0x3882ab['assetExtractionDraft'] || {}),
            hybridQualityPolicyVersion: _0x5a7228['hybridQualityPolicyVersion'],
            hybridExtractionMode: _0x5a7228['hybridExtractionMode'],
            hybridCapacityFallback: cloneValue(_0x5a7228['hybridCapacityFallback']),
            hybridEvidenceScenes: cloneValue(_0x5a7228['hybridEvidenceScenes']),
            hybridLocalRuntime: cloneValue(_0x5a7228['hybridLocalRuntime']),
            hybridCandidateInventory: cloneValue(_0x5a7228['hybridCandidateInventory']),
            hybridAuthoritativeSourceFingerprint: _0x5a7228['hybridAuthoritativeSourceFingerprint'],
          });
        throw _0x3882ab;
      }
      const _0x3d7117 = removeNarrativeUploadFallbackCharacterAssets(
        _0xbfeddd,
        _0x772aa1,
        _0xf94a0f,
        _0xf94a0f,
      );
      try {
        assertStoryAssetPublicResultQuality(_0x3d7117, _0xf94a0f, _0x3ad0fe);
      } catch (_0x3f1211) {
        await checkpointStoryAssetQualityFailure(_0x3f1211, _0x5a7228, _0x4adc72);
        throw _0x3f1211;
      }
      return {
        ..._0x3d7117,
        extractionStrategy: _0x3d7117['extractionStrategy'],
        extractionMode: _0x402d5d,
        localRuntime: localRuntime,
      };
    },
    _0x41c225 = hasCompleteStructuredStorySceneEvidence(_0xf94a0f, _0x772aa1);
  if (shouldUseDirectStoryAssetApi(project, _0xf94a0f)) {
    const _0x11f69d = getStoryProjectChapterCharacters(project),
      _0x4ea5f0 = getReusableStoryAssetCandidateInventory(
        _0x21be0b,
        _0x3895a1,
        _0x6eed6b ? [_0x21be0b?.['hybridAuthoritativeSourceFingerprint']] : [],
      ),
      _0x2f43c7 = Boolean(_0x21be0b && !_0x4ea5f0);
    let _0x38707f = _0x4ea5f0;
    if (!_0x38707f && _0x2f43c7)
      _0x38707f = createStoryAssetCandidateInventory({ status: 'disabled', sourceFingerprint: _0x3895a1 });
    else {
      if (!_0x38707f && !preferLocal)
        _0x38707f = createStoryAssetCandidateInventory({ status: 'disabled', sourceFingerprint: _0x3895a1 });
      else {
        if (!_0x38707f)
          try {
            const _0x240cc5 = await extractStoryAssetMentionsLocal({
                sourceScenes: _0xf94a0f,
                ...(typeof localExtract === 'function' ? { localExtract: localExtract } : {}),
                onProgress: onProgress,
              }),
              _0x3a8c56 = _0x240cc5['mentions']['length']
                ? createStoryAssetLocalEvidenceScenes(_0xf94a0f, _0x240cc5['mentions'])
                : [],
              _0x457390 = {
                model: _0x240cc5['model'],
                device: _0x240cc5['device'],
                precision: _0x240cc5['precision'],
                mentionCount: _0x240cc5['mentions']['length'],
                originalCharacters: _0xf94a0f['reduce'](
                  (_0x52c703, _0x45eb2a) => _0x52c703 + _0x45eb2a['body']['length'],
                  0x0,
                ),
                evidenceCharacters: _0x3a8c56['reduce'](
                  (_0x439087, _0x10c071) => _0x439087 + _0x10c071['body']['length'],
                  0x0,
                ),
              };
            ((_0x38707f = createStoryAssetCandidateInventory({
              status: 'ready',
              evidenceScenes: _0x3a8c56,
              localRuntime: _0x457390,
              sourceFingerprint: _0x3895a1,
            })),
              reportDiagnostics(diagnostics, 'story-asset-hybrid-local', {
                status: 'succeeded',
                ..._0x457390,
                purpose: 'optional-candidate-inventory',
              }));
          } catch (_0x4a71bb) {
            ((_0x38707f = createStoryAssetCandidateInventory({
              status: 'unavailable',
              sourceFingerprint: _0x3895a1,
            })),
              reportDiagnostics(diagnostics, 'story-asset-hybrid-local', {
                status: 'fallback',
                purpose: 'optional-candidate-inventory',
                errorMessage: String(_0x4a71bb?.['message'] || _0x4a71bb || ''),
              }));
          }
      }
    }
    const _0x223c09 = createBudgetedStoryAssetEvidenceProject(project, _0xf94a0f, {
        requirementEvidence: _0x772aa1,
        includeAllSceneHeadings: !![],
        includeAllSceneCharacters: !![],
        bodyCharacterBudget: STORY_ASSET_DIRECT_API_MAX_SOURCE_CHARACTERS,
      }),
      _0x4aea88 =
        _0x38707f['status'] === 'ready' && _0x38707f['evidenceScenes']['length']
          ? createStoryAssetOptionalCandidatesByKind(_0x38707f['evidenceScenes'], _0xf94a0f, {
              maxItemsPerKind: STORY_ASSET_CANDIDATE_MAX_ITEMS_PER_KIND,
              maxCharactersPerKind: STORY_ASSET_CANDIDATE_MAX_CHARACTERS_PER_KIND,
              hardRequiredAssetNamesByKind: _0x3ad0fe,
            })
          : createEmptyStoryAssetCandidatesByKind(),
      _0xf89390 = mergeStoryAssetActionPropCandidates(_0x4aea88, _0xf94a0f);
    let _0x5623f6 = null;
    try {
      _0x5623f6 = resolveStoryAssetFocusedOutputMode({
        requiredAssetNamesByKind: _0x3ad0fe,
        candidateAssetsByKind: _0xf89390,
        maxOutputTokens: STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
      });
    } catch (_0x480961) {
      if (_0x480961?.['type'] !== 'ASSET_OUTPUT_CAPACITY') throw _0x480961;
      return _0x156c2b({
        extractionMode: 'parallel-api-capacity-batched',
        localRuntime: _0x38707f['localRuntime'] || null,
        candidateInventory: _0x38707f,
        capacityError: _0x480961,
      });
    }
    const _0x1aea23 = _0x5623f6['candidateAssetsByKind'];
    (reportDiagnostics(diagnostics, 'story-asset-hybrid-parallel-api', {
      status: 'started',
      chapterCharacters: _0x11f69d,
      sourceSceneCount: _0xf94a0f['length'],
    }),
      onProgress?.({
        stage: 'parallel-api-asset-extraction',
        current: 0x0,
        total: 0x3,
        message: '完整剧本共 ' + _0x11f69d + ' 字，正在分别提取角色、场景与道具；三类各调用一次且不自动重试',
      }));
    const _0x4472a3 = _0x21be0b,
      _0x534587 = createStoryAssetQualityResumeRequirementAliases(_0x21be0b, _0x3ad0fe, _0xf94a0f),
      _0x5bd31f =
        _0x21be0b && Number(_0x21be0b?.['hybridQualityPolicyVersion'] || 0x0) < 0x5
          ? [{ project: project, requiredAssetNamesByKind: _0x3ad0fe }]
          : [],
      _0x51bd07 = isStoryAssetSceneHeadingContractMigration({
        resumeDraft: _0x4472a3,
        requiredAssetNamesByKind: _0x3ad0fe,
        requiredAssetsByKind: _0x3d8029,
        candidateAssetsByKind: _0x1aea23,
        responseModeByKind: _0x5623f6['modeByKind'],
      }),
      _0x43d641 = _0x51bd07;
    _0x51bd07 &&
      (_0x5bd31f['push']({
        project: _0x223c09,
        requiredAssetNamesByKind: getSavedStoryAssetRequiredNamesByKind(_0x4472a3),
      }),
      reportDiagnostics(diagnostics, 'story-asset-hybrid-resume', {
        status: 'compatibility-migration',
        reason: 'scene-heading-label-normalization',
      }));
    let _0x1b3f9e = null;
    const _0x5ad707 = await extractStoryAssetsParallel({
        ..._0x411d9b,
        project: _0x223c09,
        requiredAssetNamesByKind: _0x3ad0fe,
        requiredAssetsByKind: _0x3d8029,
        candidateAssetsByKind: _0x1aea23,
        compactOutputByKind: _0x5623f6['modeByKind'],
        resumeRequiredAssetNamesByKindAliases: _0x534587,
        resumeSourceAliases: _0x5bd31f,
        resumeSourceFingerprintAliases: [],
        allowSavedPaidResultContractRevalidation: _0x43d641,
        allowOversizedPrompt: !![],
        automaticRecovery: ![],
        structuredOutputFallback: 'none',
        maxOutputTokens: STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
        onCheckpoint: async (_0x556913) => {
          const _0x11bdd8 = {
            ..._0x556913,
            hybridQualityPolicyVersion: STORY_ASSET_HYBRID_QUALITY_POLICY_VERSION,
            hybridExtractionMode: 'parallel-api',
            hybridEvidenceScenes: cloneValue(_0xf94a0f),
            hybridCandidateInventory: cloneValue(_0x38707f),
            hybridAuthoritativeSourceFingerprint: _0x3895a1,
          };
          ((_0x1b3f9e = cloneValue(_0x11bdd8)), await onCheckpoint?.(_0x11bdd8));
        },
        resumeDraft: _0x4472a3,
        resumeCompatibilityPolicyVersion: Number(_0x21be0b?.['hybridQualityPolicyVersion'] || 0x0),
        onProgress: onProgress,
      }),
      _0xecce38 = removeNarrativeUploadFallbackCharacterAssets(
        consolidateDirectStorySceneAssets(
          lockStoryAssetRequiredSourceChapterIds(_0x5ad707, _0x3d8029, _0x1aea23),
          _0x3ad0fe['scene'],
        ),
        _0x772aa1,
        _0xf94a0f,
        _0xf94a0f,
      );
    try {
      assertStoryAssetPublicResultQuality(_0xecce38, _0xf94a0f, _0x3ad0fe);
    } catch (_0x4c0a43) {
      await checkpointStoryAssetQualityFailure(_0x4c0a43, _0x1b3f9e, onCheckpoint);
      throw _0x4c0a43;
    }
    return (
      reportDiagnostics(diagnostics, 'story-asset-hybrid-parallel-api', {
        status: 'succeeded',
        chapterCharacters: _0x11f69d,
        assetCount: _0xecce38['assets']['length'],
      }),
      { ..._0xecce38, extractionMode: 'parallel-api', localRuntime: _0x38707f['localRuntime'] || null }
    );
  }
  let _0x101330 = 'api-fallback',
    _0xc472cf = null,
    _0x23bf9b = ![];
  const _0x3d5f1a =
      _0x21be0b?.['qualityReview']?.['status'] === 'blocked'
        ? String(_0x21be0b?.['hybridExtractionMode'] || '')['trim']()
        : '',
    _0x41106b = Boolean(
      Array['isArray'](_0x21be0b?.['hybridEvidenceScenes']) &&
      (_0x21be0b?.['hybridExtractionMode'] === 'local-pp-uie' ||
        _0x21be0b?.['strategy'] === STORY_ASSET_EVIDENCE_BATCHED_DRAFT_STRATEGY),
    );
  let _0x28fa3e = _0x41106b ? cloneValue(_0x21be0b['hybridEvidenceScenes']) : null;
  if (_0x3d5f1a === 'api-fallback')
    ((_0x23bf9b =
      _0x21be0b?.['strategy'] === STORY_ASSET_PARALLEL_DRAFT_STRATEGY &&
      Array['isArray'](_0x21be0b?.['hybridEvidenceScenes'])),
      (_0x28fa3e = _0x23bf9b ? cloneValue(_0x21be0b['hybridEvidenceScenes']) : _0xf94a0f));
  else {
    if (preferLocal && !_0x28fa3e)
      try {
        const _0x1eb96a = await extractStoryAssetMentionsLocal({
          sourceScenes: _0xf94a0f,
          ...(typeof localExtract === 'function' ? { localExtract: localExtract } : {}),
          onProgress: onProgress,
        });
        if (!_0x1eb96a['mentions']['length'] && !_0x41c225) throw createMissingLocalStoryAssetEvidenceError();
        ((_0x28fa3e = createStoryAssetLocalEvidenceScenes(_0xf94a0f, _0x1eb96a['mentions'])),
          (_0x101330 = 'local-pp-uie'),
          (_0xc472cf = {
            model: _0x1eb96a['model'],
            device: _0x1eb96a['device'],
            precision: _0x1eb96a['precision'],
            mentionCount: _0x1eb96a['mentions']['length'],
            originalCharacters: _0xf94a0f['reduce'](
              (_0x1f4c6e, _0x7371ad) => _0x1f4c6e + _0x7371ad['body']['length'],
              0x0,
            ),
            evidenceCharacters: _0x28fa3e['reduce'](
              (_0x50d070, _0x206177) => _0x50d070 + _0x206177['body']['length'],
              0x0,
            ),
          }),
          reportDiagnostics(diagnostics, 'story-asset-hybrid-local', { status: 'succeeded', ..._0xc472cf }),
          onProgress?.({
            stage: 'local-evidence-ready',
            current: 0x1,
            total: 0x1,
            message:
              'PP-UIE 已把正文压缩为 ' +
              _0xc472cf['evidenceCharacters'] +
              ' 字证据，正在按资产建立档案并调用 API 核验事实、补全视觉',
          }));
      } catch (_0x382429) {
        if (!_0x41c225) {
          reportDiagnostics(diagnostics, 'story-asset-hybrid-local', {
            status: 'stopped',
            errorMessage: String(_0x382429?.['message'] || _0x382429 || ''),
            apiRequestCount: 0x0,
          });
          throw createMissingLocalStoryAssetEvidenceError(_0x382429);
        }
        ((_0x101330 = 'api-fallback'),
          (_0x28fa3e = createStoryAssetLocalEvidenceScenes(_0xf94a0f, [])),
          (_0x23bf9b = !![]),
          reportDiagnostics(diagnostics, 'story-asset-hybrid-local', {
            status: 'fallback',
            errorMessage: String(_0x382429?.['message'] || _0x382429 || ''),
          }),
          onProgress?.({
            stage: 'local-evidence-fallback',
            current: 0x0,
            total: 0x1,
            message: '本地 PP-UIE 不可用，已改用结构化首尾证据；角色、场景、道具各调用一次且不自动重试',
          }));
      }
    else
      _0x28fa3e
        ? ((_0x101330 = 'local-pp-uie'),
          (_0xc472cf = _0x21be0b?.['hybridLocalRuntime']
            ? cloneValue(_0x21be0b['hybridLocalRuntime'])
            : null))
        : ((_0x28fa3e = createStoryAssetLocalEvidenceScenes(_0xf94a0f, [])), (_0x23bf9b = !![]));
  }
  if (_0x101330 === 'local-pp-uie' || _0x23bf9b) {
    const _0x164293 = _0x21be0b,
      _0x32ee1f = createStoryAssetQualityResumeRequirementAliases(_0x21be0b, _0x3ad0fe, _0xf94a0f),
      _0x2c7cc3 = createBudgetedStoryAssetEvidenceProject(project, _0x28fa3e, {
        requirementEvidence: _0x772aa1,
      }),
      _0x136edf = Number(_0x21be0b?.['hybridQualityPolicyVersion']) || 0x0,
      _0x2ed0d7 = _0x32ee1f['map']((_0x5c7101) => ({
        project: createBudgetedStoryAssetEvidenceProject(
          project,
          _0x28fa3e,
          _0x136edf >= 0x3
            ? { requirementEvidence: _0x772aa1, includeAllSceneCharacters: !![] }
            : { includeAllSceneHeadings: !![], includeAllSceneCharacters: !![] },
        ),
        requiredAssetNamesByKind: _0x5c7101,
      }));
    _0x21be0b &&
      _0x136edf < 0x5 &&
      _0x2ed0d7['push']({
        project: createBudgetedStoryAssetEvidenceProject(project, _0x28fa3e, {
          requirementEvidence: _0x772aa1,
          includeAllSceneHeadings: _0x136edf < 0x3,
          includeAllSceneCharacters: !![],
          bodyCharacterBudget: Number['MAX_SAFE_INTEGER'],
        }),
        requiredAssetNamesByKind: _0x3ad0fe,
      });
    const _0x525b9f = mergeStoryAssetActionPropCandidates(
      createStoryAssetOptionalCandidatesByKind(_0x28fa3e, _0xf94a0f, {
        maxItemsPerKind: STORY_ASSET_CANDIDATE_MAX_ITEMS_PER_KIND,
        maxCharactersPerKind: STORY_ASSET_CANDIDATE_MAX_CHARACTERS_PER_KIND,
        hardRequiredAssetNamesByKind: _0x3ad0fe,
      }),
      _0xf94a0f,
    );
    let _0xff7118 = null;
    try {
      _0xff7118 = resolveStoryAssetFocusedOutputMode({
        requiredAssetNamesByKind: _0x3ad0fe,
        candidateAssetsByKind: _0x525b9f,
        maxOutputTokens: STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
      });
    } catch (_0x39e542) {
      if (_0x39e542?.['type'] !== 'ASSET_OUTPUT_CAPACITY') throw _0x39e542;
      return _0x156c2b({
        extractionMode: _0x101330 + '-capacity-batched',
        localRuntime: _0xc472cf,
        capacityError: _0x39e542,
      });
    }
    const _0x1a8609 = _0xff7118['candidateAssetsByKind'],
      _0x3b8233 = isStoryAssetSceneHeadingContractMigration({
        resumeDraft: _0x164293,
        requiredAssetNamesByKind: _0x3ad0fe,
        requiredAssetsByKind: _0x3d8029,
        candidateAssetsByKind: _0x1a8609,
        responseModeByKind: _0xff7118['modeByKind'],
      }),
      _0x5b8ce1 = _0x3b8233;
    _0x3b8233 &&
      (_0x2ed0d7['push']({
        project: _0x2c7cc3,
        requiredAssetNamesByKind: getSavedStoryAssetRequiredNamesByKind(_0x164293),
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
        _0x101330 === 'local-pp-uie'
          ? '本地证据已准备，正在并行反推角色、场景与道具；三类各调用一次且不自动重试'
          : '结构化证据已准备，正在并行反推角色、场景与道具；三类各调用一次且不自动重试',
    });
    let _0x188c09 = null;
    const _0x305a49 = async (_0x204748) => {
        const _0x535e7a = {
          ..._0x204748,
          hybridQualityPolicyVersion: STORY_ASSET_HYBRID_QUALITY_POLICY_VERSION,
          hybridExtractionMode: _0x101330,
          hybridEvidenceScenes: cloneValue(_0x28fa3e),
          hybridLocalRuntime: _0xc472cf || _0x204748?.['hybridLocalRuntime'] || null,
          hybridAuthoritativeSourceFingerprint: _0x3895a1,
        };
        ((_0x188c09 = cloneValue(_0x535e7a)), await onCheckpoint?.(_0x535e7a));
      },
      _0x28de0a = await extractStoryAssetsParallel({
        ..._0x411d9b,
        project: _0x2c7cc3,
        requiredAssetNamesByKind: _0x3ad0fe,
        requiredAssetsByKind: _0x3d8029,
        candidateAssetsByKind: _0x1a8609,
        compactOutputByKind: _0xff7118['modeByKind'],
        resumeRequiredAssetNamesByKindAliases: _0x32ee1f,
        resumeSourceAliases: _0x2ed0d7,
        resumeSourceFingerprintAliases: [],
        allowSavedPaidResultContractRevalidation: _0x5b8ce1,
        allowOversizedPrompt: !![],
        automaticRecovery: ![],
        structuredOutputFallback: 'none',
        maxOutputTokens: STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
        resumeDraft: _0x164293,
        resumeCompatibilityPolicyVersion: Number(_0x21be0b?.['hybridQualityPolicyVersion'] || 0x0),
        onProgress: onProgress,
        onCheckpoint: _0x305a49,
      }),
      _0x5271a2 = removeNarrativeUploadFallbackCharacterAssets(
        consolidateDirectStorySceneAssets(
          lockStoryAssetRequiredSourceChapterIds(_0x28de0a, _0x3d8029, _0x1a8609),
          _0x3ad0fe['scene'],
        ),
        _0x772aa1,
        _0x28fa3e,
        _0xf94a0f,
        { requireVerifiedFallbackCharacters: !![] },
      );
    try {
      assertStoryAssetPublicResultQuality(_0x5271a2, _0xf94a0f, _0x3ad0fe);
    } catch (_0x4b58df) {
      await checkpointStoryAssetQualityFailure(_0x4b58df, _0x188c09, _0x305a49);
      throw _0x4b58df;
    }
    return {
      ..._0x5271a2,
      extractionStrategy:
        _0x101330 === 'local-pp-uie' ? 'local-pp-uie-plus-parallel-api' : 'bounded-parallel-api-fallback',
      extractionMode: _0x101330,
      localRuntime: _0xc472cf,
    };
  }
  let _0x3c8953 = null;
  const _0x4d131b = async (_0x2ebda0) => {
      const _0x41f0d5 = {
        ..._0x2ebda0,
        hybridQualityPolicyVersion: STORY_ASSET_HYBRID_QUALITY_POLICY_VERSION,
        hybridExtractionMode: _0x101330,
        hybridEvidenceScenes: _0x101330 === 'local-pp-uie' ? cloneValue(_0x28fa3e) : null,
        hybridLocalRuntime: _0xc472cf || _0x2ebda0?.['hybridLocalRuntime'] || null,
        hybridAuthoritativeSourceFingerprint: _0x3895a1,
      };
      ((_0x3c8953 = cloneValue(_0x41f0d5)), await onCheckpoint?.(_0x41f0d5));
    },
    _0x425912 = await extractStoryAssetsEvidenceBatched({
      ..._0x411d9b,
      project: project,
      episodes: episodes,
      sourceScenes: _0x28fa3e,
      authoritativeSourceScenes: createHardAuthoritativeSourceScenes(_0xf94a0f, _0x772aa1),
      diagnostics: diagnostics,
      onProgress: onProgress,
      resumeDraft: _0x21be0b,
      allowLocalBaselineFallback: ![],
      requestLimit: 0x3,
      onCheckpoint: _0x4d131b,
    }),
    _0x52f24f = removeNarrativeUploadFallbackCharacterAssets(_0x425912, _0x772aa1, _0x28fa3e, _0xf94a0f);
  try {
    assertStoryAssetPublicResultQuality(_0x52f24f, _0xf94a0f, _0x3ad0fe);
  } catch (_0x564bfe) {
    await checkpointStoryAssetQualityFailure(_0x564bfe, _0x3c8953, _0x4d131b);
    throw _0x564bfe;
  }
  return {
    ..._0x52f24f,
    extractionStrategy: _0x52f24f['extractionStrategy'],
    extractionMode: _0x101330,
    localRuntime: _0xc472cf,
  };
}
