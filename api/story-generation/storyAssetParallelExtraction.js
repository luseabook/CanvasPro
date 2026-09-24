import { withReplicationRequestPolicy } from './storyRequestPolicy.js';
import { STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS } from './storyAssetHybridBudget.js';
import {
  STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION,
  createStoryAssetPromptContracts,
} from './storyAssetExtractionRequest.js';
const STORY_ASSET_DETAILED_DRAFT_STRATEGY = 'kind-detailed-parallel-v1';
function cloneStoryAssetDetailedExtractionValue(_0x449227) {
  if (!_0x449227 || typeof _0x449227 !== 'object') return null;
  try {
    return JSON['parse'](JSON['stringify'](_0x449227));
  } catch {
    return null;
  }
}
function classifyStoryAssetDetailedExtractionError(_0x2017a9, _0x3969fb) {
  const _0x5508b0 = _0x3969fb(_0x2017a9?.['message'] || _0x2017a9),
    _0xb59982 = _0x3969fb(_0x2017a9?.['type'] || _0x2017a9?.['code'])['toUpperCase']();
  if (_0xb59982['includes']('TIMEOUT') || /超时|timeout/iu['test'](_0x5508b0)) return 'timeout';
  if (
    _0xb59982['includes']('DNS') ||
    _0xb59982['includes']('ENOTFOUND') ||
    _0xb59982['includes']('EAI_AGAIN') ||
    /dns|name\s+resolution|getaddrinfo|域名解析/iu['test'](_0x5508b0)
  )
    return 'dns-error';
  if (
    _0xb59982['includes']('NETWORK') ||
    /fetch\s+failed|failed\s+to\s+fetch|network\s+(?:error|failure)|网络(?:错误|异常|失败)/iu['test'](
      _0x5508b0,
    )
  )
    return 'network-error';
  if (
    _0xb59982['includes']('ECONNRESET') ||
    _0xb59982['includes']('ECONNABORTED') ||
    _0xb59982['includes']('UND_ERR_SOCKET') ||
    /connection\s*(?:reset|closed|aborted)|socket\s*hang\s*up|连接(?:被)?重置|连接中断/iu['test'](_0x5508b0)
  )
    return 'connection-reset';
  if (_0xb59982['includes']('RATE') || /限流|rate.?limit|429/iu['test'](_0x5508b0)) return 'rate-limit';
  if (/too\s+many\s+states|schema\s+(?:constraint|complexity)|constraint[^.]*schema/iu['test'](_0x5508b0))
    return 'schema-complexity';
  if (_0xb59982['includes']('LENGTH') || /截断|token|length/iu['test'](_0x5508b0)) return 'length';
  if (_0xb59982['includes']('JSON') || /JSON|返回格式|没有可用/u['test'](_0x5508b0)) return 'invalid-json';
  return 'request-error';
}
function isStoryAssetConfirmedUnchargedRejection(_0x1ae8c3) {
  const _0x1e0345 = Number(_0x1ae8c3?.['status'] ?? _0x1ae8c3?.['statusCode']);
  return [0x190, 0x191, 0x193, 0x194, 0x199, 0x1a6, 0x1ad]['includes'](_0x1e0345);
}
function isStoryAssetPaidRerunAuthorized(_0x3f8ab3, _0x257199) {
  if (!_0x3f8ab3 || typeof _0x3f8ab3 !== 'object') return ![];
  const _0x3e4cff = Array['isArray'](_0x3f8ab3['authorizedKinds']) ? _0x3f8ab3['authorizedKinds'] : [];
  return _0x3f8ab3['confirmed'] === !![] && _0x3e4cff['includes'](_0x257199);
}
function archiveStoryAssetPaidLane(_0x419604, _0x4eea29, _0x2dd5ae) {
  const _0x1f2379 =
    _0x419604['paidResponseHistoryByKind'] && typeof _0x419604['paidResponseHistoryByKind'] === 'object'
      ? _0x419604['paidResponseHistoryByKind']
      : {};
  _0x419604['paidResponseHistoryByKind'] = _0x1f2379;
  const _0x54483c = Array['isArray'](_0x1f2379[_0x4eea29]) ? _0x1f2379[_0x4eea29] : [];
  (_0x54483c['push']({
    archivedAt: Date['now'](),
    reason: _0x2dd5ae,
    rawResponse: Object['hasOwn'](_0x419604['rawResponsesByKind'] || {}, _0x4eea29)
      ? _0x419604['rawResponsesByKind'][_0x4eea29]
      : '',
    responseMode: _0x419604['rawResponseModesByKind']?.[_0x4eea29] || '',
    contractSnapshot: cloneStoryAssetDetailedExtractionValue(
      _0x419604['rawResponseContractSnapshotsByKind']?.[_0x4eea29],
    ),
    decisions: cloneStoryAssetDetailedExtractionValue(_0x419604['decisionsByKind']?.[_0x4eea29]),
    assets: cloneStoryAssetDetailedExtractionValue(_0x419604['assetsByKind']?.[_0x4eea29]) || [],
    submissionState: cloneStoryAssetDetailedExtractionValue(_0x419604['submissionStatesByKind']?.[_0x4eea29]),
    kindState: cloneStoryAssetDetailedExtractionValue(_0x419604['kindStates']?.[_0x4eea29]),
  }),
    (_0x1f2379[_0x4eea29] = _0x54483c));
}
function clearStoryAssetPaidLane(_0x40cfd9, _0x41936a, _0x34fb2e) {
  (archiveStoryAssetPaidLane(_0x40cfd9, _0x41936a, _0x34fb2e),
    (_0x40cfd9['assetsByKind'][_0x41936a] = []),
    delete _0x40cfd9['rawResponsesByKind'][_0x41936a],
    delete _0x40cfd9['rawResponseModesByKind'][_0x41936a],
    delete _0x40cfd9['rawResponseContractSnapshotsByKind'][_0x41936a],
    delete _0x40cfd9['paidResponseReceivedByKind'][_0x41936a],
    delete _0x40cfd9['decisionsByKind'][_0x41936a],
    delete _0x40cfd9['submissionStatesByKind'][_0x41936a]);
}
function makeUniqueStoryAssetExtractionRef(_0x24d238, _0x3b86de, _0x1956c6, _0x18edb4) {
  const _0x3ac2d1 = _0x18edb4(_0x24d238, _0x3b86de);
  if (!_0x1956c6['has'](_0x3ac2d1)) return (_0x1956c6['add'](_0x3ac2d1), _0x3ac2d1);
  let _0x54aa6f = 0x2,
    _0x5c32af = _0x3b86de + '-' + _0x54aa6f;
  while (_0x1956c6['has'](_0x5c32af)) {
    ((_0x54aa6f += 0x1), (_0x5c32af = _0x3b86de + '-' + _0x54aa6f));
  }
  return (_0x1956c6['add'](_0x5c32af), _0x5c32af);
}
export function createParallelStoryAssetExtractor({
  schemaVersion: _0x2d9a62,
  assetKinds: _0x4b50f3,
  generateText: _0x23177e,
  normalizeText: _0x18dff1,
  getResultText: _0x260132,
  normalizeStoryProjectInput: _0x1147ea,
  normalizeAssetReference: _0x32640b,
  parseStoryAssetExtractionResult: _0x23571f,
  parseStoryAssetCompactExtractionResult: _0xed3827,
  extractStoryAssets: _0x1199ff,
} = {}) {
  function _0x2c0bb7(_0x542b86) {
    const _0x1ff4c4 = JSON['stringify'](_0x542b86);
    let _0x31d2c0 = 0x811c9dc5;
    for (let _0x19cff9 = 0x0; _0x19cff9 < _0x1ff4c4['length']; _0x19cff9 += 0x1) {
      ((_0x31d2c0 ^= _0x1ff4c4['charCodeAt'](_0x19cff9)), (_0x31d2c0 = Math['imul'](_0x31d2c0, 0x1000193)));
    }
    return (
      _0x2d9a62 +
      '-' +
      (_0x31d2c0 >>> 0x0)['toString'](0x10)['padStart'](0x8, '0') +
      '-' +
      _0x1ff4c4['length']
    );
  }
  function _0x44c6a6({
    project: project = {},
    aspectRatio: aspectRatio = '',
    visualStyle: visualStyle = '',
    requiredAssetNamesByKind: requiredAssetNamesByKind = null,
    compactOutput: compactOutput = ![],
    compactOutputByKind: compactOutputByKind = null,
  } = {}) {
    const _0x506a33 = _0x1147ea(project);
    return _0x2c0bb7({
      title: _0x506a33['title'],
      chapters: _0x506a33['chapters'],
      aspectRatio: _0x18dff1(aspectRatio) || _0x506a33['aspectRatio'],
      visualStyle: _0x18dff1(visualStyle) || _0x506a33['visualStyle'],
      extractionStrategy: STORY_ASSET_DETAILED_DRAFT_STRATEGY,
      extractionKinds: _0x4b50f3,
      compactOutputByKind:
        compactOutputByKind && typeof compactOutputByKind === 'object'
          ? compactOutputByKind
          : Object['fromEntries'](_0x4b50f3['map']((_0x36db31) => [_0x36db31, Boolean(compactOutput)])),
      ...(requiredAssetNamesByKind ? { requiredAssetNamesByKind: requiredAssetNamesByKind } : {}),
    });
  }
  function _0x566af8(
    _0x27595b,
    {
      requiredAssetNamesByKind: requiredAssetNamesByKind = null,
      requiredAssetsByKind: requiredAssetsByKind = null,
      candidateAssetsByKind: candidateAssetsByKind = null,
      responseMode: responseMode = 'verbose',
    } = {},
  ) {
    const _0x422f23 = (_0x112308 = []) =>
      (Array['isArray'](_0x112308) ? _0x112308 : [])['map']((_0xdbd950) => ({
        name: _0x18dff1(_0xdbd950 && typeof _0xdbd950 === 'object' ? _0xdbd950['name'] : _0xdbd950),
        sourceSceneRefs: Array['isArray'](_0xdbd950?.['sourceSceneRefs'])
          ? _0xdbd950['sourceSceneRefs']['map'](_0x18dff1)['filter'](Boolean)
          : [],
        sourceChapterIds: Array['isArray'](_0xdbd950?.['sourceChapterIds'])
          ? _0xdbd950['sourceChapterIds']['map'](_0x18dff1)['filter'](Boolean)
          : [],
        role: _0x18dff1(_0xdbd950?.['role']),
        fixedTraits: _0x18dff1(_0xdbd950?.['fixedTraits']),
      }));
    return _0x2c0bb7({
      kind: _0x27595b,
      responseMode: responseMode,
      ...(responseMode === 'compact'
        ? { responseSchemaVersion: STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION }
        : {}),
      requiredNames: _0x422f23(requiredAssetNamesByKind?.[_0x27595b]),
      requiredContracts: _0x422f23(requiredAssetsByKind?.[_0x27595b]),
      candidateContracts: _0x422f23(candidateAssetsByKind?.[_0x27595b]),
    });
  }
  function _0x186fca(
    _0x515ab8,
    {
      requiredAssetNamesByKind: requiredAssetNamesByKind = null,
      requiredAssetsByKind: requiredAssetsByKind = null,
      candidateAssetsByKind: candidateAssetsByKind = null,
      responseMode: responseMode = 'verbose',
    } = {},
  ) {
    const _0x2b4f66 = createStoryAssetPromptContracts(
      [_0x515ab8],
      requiredAssetNamesByKind,
      candidateAssetsByKind,
      requiredAssetsByKind,
      { includeClientKeys: responseMode === 'compact' },
    )['payload'];
    return {
      kind: _0x515ab8,
      responseMode: responseMode,
      responseSchemaVersion: responseMode === 'compact' ? STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION : 0x1,
      requiredAssets: cloneStoryAssetDetailedExtractionValue(_0x2b4f66['requiredAssets'] || []) || [],
      candidateAssets: cloneStoryAssetDetailedExtractionValue(_0x2b4f66['candidateAssets'] || []) || [],
    };
  }
  function _0x483ed6(_0x5106f9) {
    const _0x3fc6e7 = _0x260132(_0x5106f9);
    if (typeof _0x3fc6e7 === 'string') return _0x3fc6e7['trim']();
    try {
      return JSON['stringify'](_0x3fc6e7);
    } catch {
      return '';
    }
  }
  return async function _0xb74880({
    project: project = {},
    model: model = '',
    provider: provider = '',
    providerProfileId: providerProfileId = '',
    aspectRatio: aspectRatio = '',
    visualStyle: visualStyle = '',
    requiredAssetNamesByKind: requiredAssetNamesByKind = null,
    requiredAssetsByKind: requiredAssetsByKind = null,
    candidateAssetsByKind: candidateAssetsByKind = null,
    resumeRequiredAssetNamesByKindAliases: resumeRequiredAssetNamesByKindAliases = [],
    resumeSourceAliases: resumeSourceAliases = [],
    resumeSourceFingerprintAliases: resumeSourceFingerprintAliases = [],
    allowSavedPaidResultContractRevalidation: allowSavedPaidResultContractRevalidation = ![],
    allowOversizedPrompt: allowOversizedPrompt = !![],
    automaticRecovery: automaticRecovery = ![],
    structuredOutputFallback: structuredOutputFallback = 'prompt',
    compactOutput: compactOutput = ![],
    compactOutputByKind: compactOutputByKind = null,
    maxOutputTokens: maxOutputTokens = STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
    request: request = _0x23177e,
    onProgress: onProgress = null,
    onCheckpoint: onCheckpoint = null,
    resumeDraft: resumeDraft = null,
    paidRerunAuthorization: paidRerunAuthorization = null,
  } = {}) {
    request = withReplicationRequestPolicy(request, project);
    const _0x1e2541 = [..._0x4b50f3],
      _0xec2a5a = { character: '角色', scene: '场景', prop: '道具' },
      _0x528c06 = Object['fromEntries'](
        _0x1e2541['map']((_0x1dee92) => [
          _0x1dee92,
          compactOutputByKind && typeof compactOutputByKind === 'object'
            ? compactOutputByKind[_0x1dee92] === 'compact'
            : Boolean(compactOutput),
        ]),
      ),
      _0x5f11c5 = Object['fromEntries'](
        _0x1e2541['map']((_0x2a8c01) => [
          _0x2a8c01,
          _0x566af8(_0x2a8c01, {
            requiredAssetNamesByKind: requiredAssetNamesByKind,
            requiredAssetsByKind: requiredAssetsByKind,
            candidateAssetsByKind: candidateAssetsByKind,
            responseMode: _0x528c06[_0x2a8c01] ? 'compact' : 'verbose',
          }),
        ]),
      ),
      _0x32b729 = Object['fromEntries'](
        _0x1e2541['map']((_0x6a8c00) => [
          _0x6a8c00,
          _0x186fca(_0x6a8c00, {
            requiredAssetNamesByKind: requiredAssetNamesByKind,
            requiredAssetsByKind: requiredAssetsByKind,
            candidateAssetsByKind: candidateAssetsByKind,
            responseMode: _0x528c06[_0x6a8c00] ? 'compact' : 'verbose',
          }),
        ]),
      ),
      _0x1b5dfd = _0x1147ea(project),
      _0x557b41 = _0x1b5dfd['chapters']['map']((_0x8e4b50) => _0x8e4b50['id']),
      _0x1ec341 = _0x44c6a6({
        project: project,
        aspectRatio: aspectRatio,
        visualStyle: visualStyle,
        requiredAssetNamesByKind: requiredAssetNamesByKind,
        compactOutput: compactOutput,
        compactOutputByKind: _0x528c06,
      }),
      _0x1c046e = new Set([
        _0x1ec341,
        ...(Array['isArray'](resumeRequiredAssetNamesByKindAliases)
          ? resumeRequiredAssetNamesByKindAliases['map']((_0x3013da) =>
              _0x44c6a6({
                project: project,
                aspectRatio: aspectRatio,
                visualStyle: visualStyle,
                requiredAssetNamesByKind: _0x3013da,
                compactOutput: compactOutput,
                compactOutputByKind: _0x528c06,
              }),
            )
          : []),
        ...(Array['isArray'](resumeSourceAliases)
          ? resumeSourceAliases['map']((_0x74ed7a) =>
              _0x44c6a6({
                project: _0x74ed7a?.['project'] || project,
                aspectRatio: aspectRatio,
                visualStyle: visualStyle,
                requiredAssetNamesByKind: _0x74ed7a?.['requiredAssetNamesByKind'] ?? requiredAssetNamesByKind,
                compactOutput: compactOutput,
                compactOutputByKind: _0x528c06,
              }),
            )
          : []),
        ...(Array['isArray'](resumeSourceFingerprintAliases)
          ? resumeSourceFingerprintAliases['map'](_0x18dff1)['filter'](Boolean)
          : []),
      ]),
      _0x1366b2 = cloneStoryAssetDetailedExtractionValue(resumeDraft),
      _0x11e91b = _0x1366b2?.['strategy'] === STORY_ASSET_DETAILED_DRAFT_STRATEGY,
      _0x34eb58 = _0x1366b2?.['schemaVersion'] === _0x2d9a62,
      _0x27a6ea = _0x1c046e['has'](_0x18dff1(_0x1366b2?.['sourceFingerprint'])),
      _0x34b321 = _0x11e91b && _0x34eb58 && _0x27a6ea,
      _0x59c3d5 = Boolean(
        _0x11e91b &&
        _0x1e2541['some'](
          (_0x38ba9f) =>
            _0x1366b2?.['paidResponseReceivedByKind']?.[_0x38ba9f] ||
            Object['hasOwn'](_0x1366b2?.['rawResponsesByKind'] || {}, _0x38ba9f) ||
            Math['max'](
              0x0,
              Math['trunc'](Number(_0x1366b2?.['kindStates']?.[_0x38ba9f]?.['requestCount']) || 0x0),
            ) > 0x0 ||
            [
              'submitted',
              'ambiguous',
              'response-received',
              'blocked-paid-response',
              'blocked-ambiguous-submission',
              'blocked-incompatible',
              'validated',
            ]['includes'](_0x18dff1(_0x1366b2?.['submissionStatesByKind']?.[_0x38ba9f]?.['status'])) ||
            (Array['isArray'](_0x1366b2?.['assetsByKind']?.[_0x38ba9f]) &&
              _0x1366b2['assetsByKind'][_0x38ba9f]['length'] > 0x0),
        ),
      ),
      _0x169c5a = Boolean(!_0x34b321 && _0x59c3d5),
      _0x304aca = Boolean(_0x169c5a && (!_0x34eb58 || !_0x27a6ea)),
      _0x305513 = Object['fromEntries'](
        _0x1e2541['map']((_0x2120e5) => [
          _0x2120e5,
          {
            kind: _0x2120e5,
            status: 'pending',
            attempt: 0x0,
            requestCount: 0x0,
            repairCount: 0x0,
            assetCount: 0x0,
            errorType: '',
            errorMessage: '',
            startedAt: 0x0,
            finishedAt: 0x0,
          },
        ]),
      );
    let _0x3b6427 =
      _0x34b321 || _0x169c5a
        ? _0x1366b2
        : {
            strategy: STORY_ASSET_DETAILED_DRAFT_STRATEGY,
            schemaVersion: _0x2d9a62,
            sourceFingerprint: _0x1ec341,
            status: 'pending',
            assetsByKind: Object['fromEntries'](_0x1e2541['map']((_0xbe632f) => [_0xbe632f, []])),
            rawResponsesByKind: {},
            rawResponseModesByKind: {},
            rawResponseContractSnapshotsByKind: {},
            paidResponseReceivedByKind: {},
            paidResponseHistoryByKind: {},
            submissionStatesByKind: {},
            decisionsByKind: {},
            contractFingerprintsByKind: _0x5f11c5,
            contractSnapshotByKind: _0x32b729,
            kindStates: _0x305513,
            completedKinds: [],
            completedAssets: [],
            failures: [],
            totalRequestCount: 0x0,
          };
    _0x3b6427['strategy'] = STORY_ASSET_DETAILED_DRAFT_STRATEGY;
    !_0x304aca && ((_0x3b6427['schemaVersion'] = _0x2d9a62), (_0x3b6427['sourceFingerprint'] = _0x1ec341));
    ((_0x3b6427['assetsByKind'] =
      _0x3b6427['assetsByKind'] && typeof _0x3b6427['assetsByKind'] === 'object'
        ? _0x3b6427['assetsByKind']
        : {}),
      (_0x3b6427['rawResponsesByKind'] =
        _0x3b6427['rawResponsesByKind'] && typeof _0x3b6427['rawResponsesByKind'] === 'object'
          ? _0x3b6427['rawResponsesByKind']
          : {}),
      (_0x3b6427['rawResponseModesByKind'] =
        _0x3b6427['rawResponseModesByKind'] && typeof _0x3b6427['rawResponseModesByKind'] === 'object'
          ? _0x3b6427['rawResponseModesByKind']
          : {}),
      (_0x3b6427['rawResponseContractSnapshotsByKind'] =
        _0x3b6427['rawResponseContractSnapshotsByKind'] &&
        typeof _0x3b6427['rawResponseContractSnapshotsByKind'] === 'object'
          ? _0x3b6427['rawResponseContractSnapshotsByKind']
          : {}),
      (_0x3b6427['paidResponseReceivedByKind'] =
        _0x3b6427['paidResponseReceivedByKind'] && typeof _0x3b6427['paidResponseReceivedByKind'] === 'object'
          ? _0x3b6427['paidResponseReceivedByKind']
          : {}),
      (_0x3b6427['paidResponseHistoryByKind'] =
        _0x3b6427['paidResponseHistoryByKind'] && typeof _0x3b6427['paidResponseHistoryByKind'] === 'object'
          ? _0x3b6427['paidResponseHistoryByKind']
          : {}),
      (_0x3b6427['submissionStatesByKind'] =
        _0x3b6427['submissionStatesByKind'] && typeof _0x3b6427['submissionStatesByKind'] === 'object'
          ? _0x3b6427['submissionStatesByKind']
          : {}),
      (_0x3b6427['decisionsByKind'] =
        _0x3b6427['decisionsByKind'] && typeof _0x3b6427['decisionsByKind'] === 'object'
          ? _0x3b6427['decisionsByKind']
          : {}));
    const _0x22bef2 =
      _0x3b6427['contractFingerprintsByKind'] && typeof _0x3b6427['contractFingerprintsByKind'] === 'object'
        ? _0x3b6427['contractFingerprintsByKind']
        : {};
    ((_0x3b6427['contractFingerprintsByKind'] = { ..._0x22bef2 }),
      (_0x3b6427['contractSnapshotByKind'] =
        _0x3b6427['contractSnapshotByKind'] && typeof _0x3b6427['contractSnapshotByKind'] === 'object'
          ? _0x3b6427['contractSnapshotByKind']
          : {}),
      (_0x3b6427['requestedContractSnapshotByKind'] = cloneStoryAssetDetailedExtractionValue(_0x32b729)),
      (_0x3b6427['responseMode'] =
        new Set(Object['values'](_0x528c06))['size'] === 0x1
          ? Object['values'](_0x528c06)[0x0]
            ? 'compact'
            : 'verbose'
          : 'mixed'),
      (_0x3b6427['kindStates'] =
        _0x3b6427['kindStates'] && typeof _0x3b6427['kindStates'] === 'object'
          ? _0x3b6427['kindStates']
          : {}));
    for (const _0x3184b8 of _0x1e2541) {
      if (!Array['isArray'](_0x3b6427['assetsByKind'][_0x3184b8])) _0x3b6427['assetsByKind'][_0x3184b8] = [];
      const _0x3c1207 = _0x3b6427['kindStates'][_0x3184b8] || {},
        _0x326700 = _0x18dff1(_0x22bef2[_0x3184b8]),
        _0x2eb294 = Boolean((_0x34b321 || _0x169c5a) && _0x326700 && _0x326700 !== _0x5f11c5[_0x3184b8]),
        _0x3770ad = Boolean(
          (_0x34b321 || _0x169c5a) &&
          Object['hasOwn'](_0x3b6427['rawResponsesByKind'], _0x3184b8) &&
          _0x18dff1(_0x3b6427['rawResponseModesByKind'][_0x3184b8] || _0x3c1207?.['responseMode']) ===
            'compact' &&
          !_0x3b6427['rawResponseContractSnapshotsByKind'][_0x3184b8],
        ),
        _0x2c27c5 = Boolean(
          _0x3b6427['paidResponseReceivedByKind'][_0x3184b8] ||
          Object['hasOwn'](_0x3b6427['rawResponsesByKind'], _0x3184b8) ||
          [
            'submitted',
            'ambiguous',
            'response-received',
            'blocked-paid-response',
            'blocked-ambiguous-submission',
            'blocked-incompatible',
            'validated',
          ]['includes'](_0x18dff1(_0x3b6427['submissionStatesByKind'][_0x3184b8]?.['status'])) ||
          Math['max'](0x0, Math['trunc'](Number(_0x3c1207?.['requestCount']) || 0x0)) > 0x0 ||
          _0x3b6427['assetsByKind'][_0x3184b8]['length'],
        ),
        _0x19fe2a = isStoryAssetPaidRerunAuthorized(paidRerunAuthorization, _0x3184b8);
      let _0x1770d9 = ![];
      const _0x4ee373 = Boolean(_0x2c27c5 && _0x3c1207?.['status'] === 'blocked-quality-rerun'),
        _0x2629d7 = Boolean(
          _0x2c27c5 &&
          !_0x4ee373 &&
          (_0x304aca ||
            _0x3c1207?.['status'] === 'blocked-incompatible' ||
            (_0x2eb294 && !allowSavedPaidResultContractRevalidation) ||
            _0x3770ad),
        );
      if ((_0x34b321 || _0x169c5a) && _0x4ee373 && !_0x19fe2a) {
        _0x3b6427['kindStates'][_0x3184b8] = {
          ..._0x3c1207,
          kind: _0x3184b8,
          status: 'blocked-quality-rerun',
          errorType: 'quality-rerun-required',
          errorMessage: '已付费结果未通过当前视觉质量合同；需要用户明确授权后才能重新请求。',
          responseMode: _0x528c06[_0x3184b8] ? 'compact' : 'verbose',
        };
        continue;
      }
      (_0x34b321 || _0x169c5a) &&
        _0x4ee373 &&
        _0x19fe2a &&
        (clearStoryAssetPaidLane(_0x3b6427, _0x3184b8, 'authorized-quality-rerun'),
        (_0x3b6427['kindStates'][_0x3184b8] = {
          ..._0x3c1207,
          status: 'pending',
          assetCount: 0x0,
          errorType: '',
          errorMessage: '',
          finishedAt: 0x0,
        }),
        (_0x1770d9 = !![]));
      if ((_0x34b321 || _0x169c5a) && _0x2629d7 && !_0x19fe2a) {
        _0x3b6427['kindStates'][_0x3184b8] = {
          ..._0x3c1207,
          kind: _0x3184b8,
          status: 'blocked-incompatible',
          errorType: 'contract-incompatible',
          errorMessage: _0x304aca
            ? '已付费结果的剧本来源或草稿版本与当前请求不兼容，需要用户明确授权后才能重新请求。'
            : _0x2eb294
              ? '已付费结果的资产合同版本与当前合同不兼容，需要用户明确授权后才能重新请求。'
              : '已付费紧凑结果缺少其原始合同快照，无法安全绑定，需要用户明确授权后才能重新请求。',
          responseMode: _0x528c06[_0x3184b8] ? 'compact' : 'verbose',
        };
        continue;
      }
      (_0x34b321 || _0x169c5a) &&
        (_0x2629d7 ||
          (!_0x2c27c5 && _0x304aca) ||
          (_0x2eb294 && !allowSavedPaidResultContractRevalidation) ||
          _0x3770ad) &&
        (_0x19fe2a || !_0x2c27c5) &&
        (_0x2c27c5
          ? clearStoryAssetPaidLane(
              _0x3b6427,
              _0x3184b8,
              _0x304aca
                ? 'authorized-source-or-schema-change-rerun'
                : _0x2eb294
                  ? 'authorized-contract-upgrade-rerun'
                  : 'authorized-missing-contract-snapshot-rerun',
            )
          : ((_0x3b6427['assetsByKind'][_0x3184b8] = []),
            delete _0x3b6427['rawResponsesByKind'][_0x3184b8],
            delete _0x3b6427['rawResponseModesByKind'][_0x3184b8],
            delete _0x3b6427['rawResponseContractSnapshotsByKind'][_0x3184b8],
            delete _0x3b6427['paidResponseReceivedByKind'][_0x3184b8],
            delete _0x3b6427['decisionsByKind'][_0x3184b8],
            delete _0x3b6427['submissionStatesByKind'][_0x3184b8]),
        (_0x3b6427['kindStates'][_0x3184b8] = {
          ..._0x3c1207,
          status: 'pending',
          assetCount: 0x0,
          errorType: '',
          errorMessage: '',
          finishedAt: 0x0,
        }),
        (_0x1770d9 = !![]));
      const _0x234428 = _0x18dff1(_0x3b6427['submissionStatesByKind'][_0x3184b8]?.['status']),
        _0x579032 = _0x18dff1(_0x3c1207?.['errorType']),
        _0x59c502 =
          !_0x1770d9 &&
          Boolean(
            _0x234428 === 'submitted' ||
            _0x234428 === 'ambiguous' ||
            _0x3c1207?.['status'] === 'blocked-ambiguous-submission' ||
            (!_0x3b6427['rawResponsesByKind'][_0x3184b8] &&
              Math['max'](0x0, Math['trunc'](Number(_0x3c1207?.['requestCount']) || 0x0)) > 0x0 &&
              (_0x3c1207?.['status'] === 'running' ||
                (_0x3c1207?.['status'] === 'failed' &&
                  ['timeout', 'connection-reset']['includes'](_0x579032)))),
          );
      if ((_0x34b321 || _0x169c5a) && _0x59c502 && !_0x19fe2a) {
        _0x3b6427['kindStates'][_0x3184b8] = {
          ..._0x3c1207,
          kind: _0x3184b8,
          status: 'blocked-ambiguous-submission',
          errorType: 'ambiguous-submission',
          errorMessage: '请求已提交但未确认是否计费成功；需要用户明确授权后才能重新请求。',
          responseMode: _0x528c06[_0x3184b8] ? 'compact' : 'verbose',
          finishedAt: Number(_0x3c1207?.['finishedAt']) || Date['now'](),
        };
        continue;
      }
      ((_0x34b321 || _0x169c5a) &&
        _0x59c502 &&
        _0x19fe2a &&
        (clearStoryAssetPaidLane(_0x3b6427, _0x3184b8, 'authorized-ambiguous-submission-rerun'),
        (_0x3b6427['kindStates'][_0x3184b8] = {
          ..._0x3c1207,
          status: 'pending',
          assetCount: 0x0,
          errorType: '',
          errorMessage: '',
          finishedAt: 0x0,
        })),
        (_0x3b6427['contractFingerprintsByKind'][_0x3184b8] = _0x5f11c5[_0x3184b8]),
        (_0x3b6427['contractSnapshotByKind'][_0x3184b8] = cloneStoryAssetDetailedExtractionValue(
          _0x32b729[_0x3184b8],
        )),
        (_0x3b6427['kindStates'][_0x3184b8] = {
          ..._0x305513[_0x3184b8],
          ...(_0x3b6427['kindStates'][_0x3184b8] || {}),
          kind: _0x3184b8,
          responseMode: _0x528c06[_0x3184b8] ? 'compact' : 'verbose',
        }));
    }
    ((_0x3b6427['schemaVersion'] = _0x2d9a62), (_0x3b6427['sourceFingerprint'] = _0x1ec341));
    let _0x4ea0f = Promise['resolve']();
    const _0x20c4a4 = async (_0x1cf9eb = '') => {
        ((_0x3b6427['completedKinds'] = _0x1e2541['filter'](
          (_0x18e1eb) => _0x3b6427['kindStates'][_0x18e1eb]?.['status'] === 'succeeded',
        )),
          (_0x3b6427['completedAssets'] = _0x1e2541['flatMap'](
            (_0x4efd14) => _0x3b6427['assetsByKind'][_0x4efd14] || [],
          )),
          (_0x3b6427['failures'] = _0x1e2541['flatMap']((_0x5778f5) => {
            const _0x1e99c7 = _0x3b6427['kindStates'][_0x5778f5];
            return _0x1e99c7?.['status'] === 'failed' ||
              String(_0x1e99c7?.['status'] || '')['startsWith']('blocked-')
              ? [
                  {
                    stage: 'kind',
                    kind: _0x5778f5,
                    errorType: _0x18dff1(_0x1e99c7['errorType']),
                    errorMessage: _0x18dff1(_0x1e99c7['errorMessage']),
                  },
                ]
              : [];
          })),
          (_0x3b6427['progress'] = {
            stage: 'kind',
            current: _0x3b6427['completedKinds']['length'],
            total: _0x1e2541['length'],
            message: _0x1cf9eb,
          }),
          (_0x3b6427['updatedAt'] = Date['now']()));
        const _0x4f7eb8 = cloneStoryAssetDetailedExtractionValue(_0x3b6427);
        (typeof onCheckpoint === 'function' &&
          ((_0x4ea0f = _0x4ea0f['then'](() => onCheckpoint(_0x4f7eb8))), await _0x4ea0f),
          onProgress?.({
            stage: 'extracting-assets-parallel',
            current: _0x3b6427['completedKinds']['length'],
            total: _0x1e2541['length'],
            message: _0x1cf9eb,
          }));
      },
      _0x8b4f76 = async (_0x5e5807, _0x180f45, _0x4f778b) => {
        ((_0x3b6427['status'] = 'blocked'), await _0x20c4a4(_0x4f778b));
        const _0x2ca25e = new Error(_0x4f778b);
        ((_0x2ca25e['type'] = _0x180f45),
          (_0x2ca25e['blockedKinds'] = [..._0x5e5807]),
          (_0x2ca25e['assetExtractionDraft'] = cloneStoryAssetDetailedExtractionValue(_0x3b6427)));
        throw _0x2ca25e;
      };
    onProgress?.({
      stage: 'extracting-assets-parallel',
      current: _0x1e2541['filter'](
        (_0x5570bc) => _0x3b6427['kindStates'][_0x5570bc]?.['status'] === 'succeeded',
      )['length'],
      total: _0x1e2541['length'],
      message: '正在并行提取角色、场景与道具',
    });
    const _0x47d2c5 = _0x1e2541['filter'](
      (_0x13b5b5) => _0x3b6427['kindStates'][_0x13b5b5]?.['status'] === 'blocked-quality-rerun',
    );
    _0x47d2c5['length'] &&
      (await _0x8b4f76(
        _0x47d2c5,
        'ASSET_VISUAL_QUALITY_RERUN_REQUIRED',
        '已付费的' +
          _0x47d2c5['map']((_0xc17e90) => _0xec2a5a[_0xc17e90])['join']('、') +
          '结果未通过视觉质量合同；未自动重新请求。',
      ));
    const _0x43d342 = _0x1e2541['filter'](
      (_0x43747a) => _0x3b6427['kindStates'][_0x43747a]?.['status'] === 'blocked-incompatible',
    );
    _0x43d342['length'] &&
      (await _0x8b4f76(
        _0x43d342,
        'ASSET_CONTRACT_INCOMPATIBLE',
        '已付费的' +
          _0x43d342['map']((_0x97eac) => _0xec2a5a[_0x97eac])['join']('、') +
          '结果与当前合同不兼容；未自动重新请求。',
      ));
    const _0x2e283d = _0x1e2541['filter'](
      (_0x3d2bdd) => _0x3b6427['kindStates'][_0x3d2bdd]?.['status'] === 'blocked-ambiguous-submission',
    );
    _0x2e283d['length'] &&
      (await _0x8b4f76(
        _0x2e283d,
        'ASSET_SUBMISSION_AMBIGUOUS',
        _0x2e283d['map']((_0x203d22) => _0xec2a5a[_0x203d22])['join']('、') +
          '请求的计费状态不明确；未自动重新请求。',
      ));
    ((_0x3b6427['status'] = 'in-progress'), await _0x20c4a4('正在并行提取角色、场景与道具'));
    for (const _0x46dd1b of _0x1e2541) {
      if (_0x3b6427['kindStates'][_0x46dd1b]?.['status'] === 'succeeded') continue;
      const _0x45d7b5 = _0x18dff1(_0x3b6427['rawResponsesByKind'][_0x46dd1b]);
      if (!_0x45d7b5) {
        if (
          _0x3b6427['paidResponseReceivedByKind'][_0x46dd1b] &&
          !isStoryAssetPaidRerunAuthorized(paidRerunAuthorization, _0x46dd1b)
        )
          _0x3b6427['kindStates'][_0x46dd1b] = {
            ..._0x3b6427['kindStates'][_0x46dd1b],
            status: 'blocked-paid-response',
            assetCount: 0x0,
            errorType: 'paid-result-validation',
            errorMessage: '已付费请求返回空内容；已停止自动重新请求。',
            finishedAt: Date['now'](),
          };
        else
          _0x3b6427['paidResponseReceivedByKind'][_0x46dd1b] &&
            isStoryAssetPaidRerunAuthorized(paidRerunAuthorization, _0x46dd1b) &&
            (clearStoryAssetPaidLane(_0x3b6427, _0x46dd1b, 'authorized-empty-paid-response-rerun'),
            (_0x3b6427['kindStates'][_0x46dd1b] = {
              ..._0x3b6427['kindStates'][_0x46dd1b],
              status: 'pending',
              assetCount: 0x0,
              errorType: '',
              errorMessage: '',
              finishedAt: 0x0,
            }));
        continue;
      }
      try {
        const _0x2f7ed2 = _0x18dff1(
            _0x3b6427['rawResponseModesByKind'][_0x46dd1b] ||
              _0x3b6427['kindStates'][_0x46dd1b]?.['responseMode'] ||
              _0x3b6427['responseMode'],
          ),
          _0x1e941f =
            _0x2f7ed2 === 'compact'
              ? _0xed3827(_0x45d7b5, {
                  assetKinds: [_0x46dd1b],
                  chapterIds: _0x557b41,
                  contractSnapshot: _0x3b6427['rawResponseContractSnapshotsByKind'][_0x46dd1b],
                })
              : _0x23571f(_0x45d7b5, {
                  chapterIds: _0x557b41,
                  allowedKinds: [_0x46dd1b],
                  allowEmptyResult:
                    Array['isArray'](requiredAssetNamesByKind?.[_0x46dd1b]) &&
                    requiredAssetNamesByKind[_0x46dd1b]['length'] === 0x0,
                });
        ((_0x3b6427['assetsByKind'][_0x46dd1b] = _0x1e941f['assets']),
          Array['isArray'](_0x1e941f?.['decisions']) &&
            (_0x3b6427['decisionsByKind'][_0x46dd1b] = cloneStoryAssetDetailedExtractionValue(
              _0x1e941f['decisions'],
            )),
          (_0x3b6427['contractFingerprintsByKind'][_0x46dd1b] = _0x5f11c5[_0x46dd1b]),
          (_0x3b6427['contractSnapshotByKind'][_0x46dd1b] = cloneStoryAssetDetailedExtractionValue(
            _0x32b729[_0x46dd1b],
          )),
          (_0x3b6427['kindStates'][_0x46dd1b] = {
            ..._0x3b6427['kindStates'][_0x46dd1b],
            status: 'succeeded',
            assetCount: _0x1e941f['assets']['length'],
            errorType: '',
            errorMessage: '',
            finishedAt: Date['now'](),
          }),
          (_0x3b6427['submissionStatesByKind'][_0x46dd1b] = {
            ..._0x3b6427['submissionStatesByKind'][_0x46dd1b],
            status: 'validated',
            validatedAt: Date['now'](),
          }),
          await _0x20c4a4(
            _0xec2a5a[_0x46dd1b] + '已从上次付费结果恢复：' + _0x1e941f['assets']['length'] + '\x20个',
          ));
      } catch (_0x17c406) {
        if (isStoryAssetPaidRerunAuthorized(paidRerunAuthorization, _0x46dd1b)) {
          (clearStoryAssetPaidLane(_0x3b6427, _0x46dd1b, 'authorized-invalid-paid-response-rerun'),
            (_0x3b6427['kindStates'][_0x46dd1b] = {
              ..._0x3b6427['kindStates'][_0x46dd1b],
              status: 'pending',
              assetCount: 0x0,
              errorType: '',
              errorMessage: '',
              finishedAt: 0x0,
            }));
          continue;
        }
        _0x3b6427['kindStates'][_0x46dd1b] = {
          ..._0x3b6427['kindStates'][_0x46dd1b],
          status: 'blocked-paid-response',
          assetCount: 0x0,
          errorType: 'paid-result-validation',
          errorMessage: _0x18dff1(_0x17c406?.['message'] || _0x17c406),
          finishedAt: Date['now'](),
        };
      }
    }
    const _0xcd965a = _0x1e2541['filter'](
      (_0x6d2cec) => _0x3b6427['kindStates'][_0x6d2cec]?.['status'] === 'blocked-paid-response',
    );
    _0xcd965a['length'] &&
      (await _0x8b4f76(
        _0xcd965a,
        'ASSET_PAID_RESULT_BLOCKED',
        '已付费的' +
          _0xcd965a['map']((_0x159418) => _0xec2a5a[_0x159418])['join']('、') +
          '结果未通过合同校验；已保留原始返回且未自动重新请求。',
      ));
    const _0x2ab721 = _0x1e2541['filter'](
        (_0x2404bb) => _0x3b6427['kindStates'][_0x2404bb]?.['status'] !== 'succeeded',
      ),
      _0x2a6798 = await Promise['allSettled'](
        _0x2ab721['map'](async (_0x506993) => {
          const _0x3bb688 =
            _0x528c06[_0x506993] &&
            Array['isArray'](requiredAssetNamesByKind?.[_0x506993]) &&
            requiredAssetNamesByKind[_0x506993]['length'] === 0x0 &&
            (!Array['isArray'](candidateAssetsByKind?.[_0x506993]) ||
              candidateAssetsByKind[_0x506993]['length'] === 0x0);
          if (_0x3bb688)
            return (
              (_0x3b6427['assetsByKind'][_0x506993] = []),
              (_0x3b6427['kindStates'][_0x506993] = {
                ..._0x3b6427['kindStates'][_0x506993],
                status: 'succeeded',
                assetCount: 0x0,
                errorType: '',
                errorMessage: '',
                finishedAt: Date['now'](),
              }),
              await _0x20c4a4(_0xec2a5a[_0x506993] + '无待提取资产，已在本地完成'),
              { schemaVersion: _0x2d9a62, assets: [] }
            );
          const _0x30fcf1 = _0x528c06[_0x506993],
            _0x28ab40 = Date['now']();
          ((_0x3b6427['kindStates'][_0x506993] = {
            ..._0x3b6427['kindStates'][_0x506993],
            status: 'running',
            attempt:
              Math['max'](
                0x0,
                Math['trunc'](Number(_0x3b6427['kindStates'][_0x506993]?.['attempt']) || 0x0),
              ) + 0x1,
            assetCount: 0x0,
            errorType: '',
            errorMessage: '',
            startedAt: _0x28ab40,
            finishedAt: 0x0,
          }),
            await _0x20c4a4(
              '正在提取' +
                _0xec2a5a[_0x506993] +
                '；已完成 ' +
                _0x3b6427['completedKinds']['length'] +
                '/' +
                _0x1e2541['length'],
            ));
          let _0x574443 = 0x0;
          try {
            const _0x40389b = await _0x1199ff({
              project: project,
              model: model,
              provider: provider,
              providerProfileId: providerProfileId,
              aspectRatio: aspectRatio,
              visualStyle: visualStyle,
              assetKinds: [_0x506993],
              requiredAssetNamesByKind: requiredAssetNamesByKind,
              requiredAssetsByKind: requiredAssetsByKind,
              candidateAssetsByKind: candidateAssetsByKind,
              compactOutput: _0x30fcf1,
              allowOversizedPrompt: allowOversizedPrompt,
              automaticRecovery: automaticRecovery,
              structuredOutputFallback: structuredOutputFallback,
              maxOutputTokens: maxOutputTokens,
              onProgress: ({ stage: _0x2e545e, message: _0x76c739 } = {}) => {
                onProgress?.({
                  stage: _0x18dff1(_0x2e545e) || 'extracting-assets-parallel',
                  current: _0x3b6427['completedKinds']['length'],
                  total: _0x1e2541['length'],
                  message: _0x18dff1(_0x76c739),
                });
              },
              request: async (_0x105ce3) => {
                ((_0x574443 += 0x1),
                  (_0x3b6427['totalRequestCount'] =
                    Math['max'](0x0, Math['trunc'](Number(_0x3b6427['totalRequestCount']) || 0x0)) + 0x1),
                  (_0x3b6427['kindStates'][_0x506993]['requestCount'] =
                    Math['max'](
                      0x0,
                      Math['trunc'](Number(_0x3b6427['kindStates'][_0x506993]?.['requestCount']) || 0x0),
                    ) + 0x1));
                _0x574443 > 0x1 &&
                  (_0x3b6427['kindStates'][_0x506993]['repairCount'] =
                    Math['max'](
                      0x0,
                      Math['trunc'](Number(_0x3b6427['kindStates'][_0x506993]?.['repairCount']) || 0x0),
                    ) + 0x1);
                ((_0x3b6427['submissionStatesByKind'][_0x506993] = {
                  status: 'submitted',
                  submittedAt: Date['now'](),
                  requestCount: _0x3b6427['kindStates'][_0x506993]['requestCount'],
                  responseMode: _0x30fcf1 ? 'compact' : 'verbose',
                  contractSnapshot: cloneStoryAssetDetailedExtractionValue(_0x32b729[_0x506993]),
                }),
                  await _0x20c4a4(
                    _0x574443 > 0x1
                      ? '正在提交' + _0xec2a5a[_0x506993] + '自动纠错请求（1/1）'
                      : '正在提交' + _0xec2a5a[_0x506993] + '提取请求',
                  ));
                const _0x36a800 = await request(_0x105ce3),
                  _0x33f197 = _0x483ed6(_0x36a800);
                ((_0x3b6427['paidResponseReceivedByKind'][_0x506993] = !![]),
                  (_0x3b6427['rawResponsesByKind'][_0x506993] = _0x33f197),
                  (_0x3b6427['rawResponseModesByKind'][_0x506993] = _0x30fcf1 ? 'compact' : 'verbose'),
                  (_0x3b6427['rawResponseContractSnapshotsByKind'][_0x506993] =
                    cloneStoryAssetDetailedExtractionValue(_0x32b729[_0x506993])),
                  (_0x3b6427['submissionStatesByKind'][_0x506993] = {
                    ..._0x3b6427['submissionStatesByKind'][_0x506993],
                    status: 'response-received',
                    responseReceivedAt: Date['now'](),
                  }));
                if (!_0x33f197) {
                  ((_0x3b6427['kindStates'][_0x506993] = {
                    ..._0x3b6427['kindStates'][_0x506993],
                    status: 'blocked-paid-response',
                    assetCount: 0x0,
                    errorType: 'empty-paid-response',
                    errorMessage: '已付费请求返回空内容；已停止自动重新请求。',
                    finishedAt: Date['now'](),
                  }),
                    (_0x3b6427['submissionStatesByKind'][_0x506993] = {
                      ..._0x3b6427['submissionStatesByKind'][_0x506993],
                      status: 'blocked-paid-response',
                      blockedAt: Date['now'](),
                      errorType: 'empty-paid-response',
                    }),
                    await _0x20c4a4(_0xec2a5a[_0x506993] + '付费请求返回空内容；已阻断且未自动重试'));
                  const _0x25fdc6 = new Error(
                    _0xec2a5a[_0x506993] + '付费请求返回空内容；需要明确授权后才能重新请求。',
                  );
                  _0x25fdc6['type'] = 'ASSET_PAID_RESULT_BLOCKED';
                  throw _0x25fdc6;
                }
                return (await _0x20c4a4(_0xec2a5a[_0x506993] + '请求已完成，正在校验付费结果'), _0x36a800);
              },
            });
            return (
              (_0x3b6427['assetsByKind'][_0x506993] = _0x40389b['assets']),
              Array['isArray'](_0x40389b?.['decisions'])
                ? (_0x3b6427['decisionsByKind'][_0x506993] = cloneStoryAssetDetailedExtractionValue(
                    _0x40389b['decisions'],
                  ))
                : delete _0x3b6427['decisionsByKind'][_0x506993],
              (_0x3b6427['contractFingerprintsByKind'][_0x506993] = _0x5f11c5[_0x506993]),
              (_0x3b6427['contractSnapshotByKind'][_0x506993] = cloneStoryAssetDetailedExtractionValue(
                _0x32b729[_0x506993],
              )),
              (_0x3b6427['kindStates'][_0x506993] = {
                ..._0x3b6427['kindStates'][_0x506993],
                status: 'succeeded',
                assetCount: _0x40389b['assets']['length'],
                errorType: '',
                errorMessage: '',
                finishedAt: Date['now'](),
              }),
              (_0x3b6427['submissionStatesByKind'][_0x506993] = {
                ..._0x3b6427['submissionStatesByKind'][_0x506993],
                status: 'validated',
                validatedAt: Date['now'](),
              }),
              await _0x20c4a4(_0xec2a5a[_0x506993] + '完成：' + _0x40389b['assets']['length'] + '\x20个'),
              _0x40389b
            );
          } catch (_0x36869a) {
            const _0x343929 = _0x18dff1(_0x3b6427['submissionStatesByKind'][_0x506993]?.['status']),
              _0xbb9184 = _0x343929 === 'response-received',
              _0x3894ac = Boolean(
                _0x36869a?.['type'] === 'ASSET_PAID_RESULT_BLOCKED' || _0x343929 === 'blocked-paid-response',
              ),
              _0x1455bb = classifyStoryAssetDetailedExtractionError(_0x36869a, _0x18dff1),
              _0x1708e6 = Boolean(
                !_0xbb9184 &&
                !_0x3894ac &&
                _0x574443 > 0x0 &&
                isStoryAssetConfirmedUnchargedRejection(_0x36869a),
              ),
              _0x18ae7d = Boolean(!_0xbb9184 && !_0x3894ac && _0x574443 > 0x0 && !_0x1708e6);
            _0x574443 > 0x0 &&
              !_0xbb9184 &&
              !_0x3894ac &&
              (_0x3b6427['submissionStatesByKind'][_0x506993] = {
                ..._0x3b6427['submissionStatesByKind'][_0x506993],
                status: _0x18ae7d ? 'ambiguous' : 'rejected-confirmed',
                failedAt: Date['now'](),
                errorType: _0x1455bb,
                errorMessage: _0x18dff1(_0x36869a?.['message'] || _0x36869a),
              });
            ((_0x3b6427['kindStates'][_0x506993] = {
              ..._0x3b6427['kindStates'][_0x506993],
              status:
                _0xbb9184 || _0x3894ac
                  ? 'blocked-paid-response'
                  : _0x18ae7d
                    ? 'blocked-ambiguous-submission'
                    : 'failed',
              assetCount: 0x0,
              errorType: _0x3894ac
                ? _0x18dff1(_0x3b6427['kindStates'][_0x506993]?.['errorType']) || 'paid-result-validation'
                : _0xbb9184
                  ? 'paid-result-validation'
                  : _0x18ae7d
                    ? 'ambiguous-submission'
                    : _0x1455bb,
              errorMessage: _0x18dff1(_0x36869a?.['message'] || _0x36869a),
              finishedAt: Date['now'](),
            }),
              await _0x20c4a4(_0xec2a5a[_0x506993] + '提取失败；已保留其他付费结果'));
            throw _0x36869a;
          }
        }),
      ),
      _0x25b462 = _0x2a6798['findIndex']((_0x30dba5) => _0x30dba5['status'] === 'rejected');
    if (_0x25b462 >= 0x0) {
      const _0xb70f5 = _0x1e2541['filter'](
          (_0x1143e9) => _0x3b6427['kindStates'][_0x1143e9]?.['status'] === 'blocked-paid-response',
        ),
        _0x2ab736 = _0x1e2541['filter'](
          (_0x51c4c3) => _0x3b6427['kindStates'][_0x51c4c3]?.['status'] === 'blocked-ambiguous-submission',
        ),
        _0x2c71d1 = [..._0xb70f5, ..._0x2ab736];
      ((_0x3b6427['status'] = _0x2c71d1['length']
        ? 'blocked'
        : _0x3b6427['completedKinds']['length']
          ? 'partial'
          : 'failed'),
        await _0x20c4a4(
          _0x2c71d1['length']
            ? _0x2c71d1['map']((_0x419ad9) => _0xec2a5a[_0x419ad9])['join']('、') +
                '已进入付费保护状态；未自动重新请求'
            : '已保留 ' +
                _0x3b6427['completedKinds']['length'] +
                '/' +
                _0x1e2541['length'] +
                ' 路付费结果；仅需重试失败项',
        ));
      const _0x3518c2 = _0x2a6798[_0x25b462]['reason'],
        _0x5acb76 = _0x2ab721[_0x25b462],
        _0x156270 = new Error(
          _0xec2a5a[_0x5acb76] + '提取失败：' + (_0x18dff1(_0x3518c2?.['message']) || '模型请求失败'),
        );
      if (_0xb70f5['length'])
        ((_0x156270['type'] = 'ASSET_PAID_RESULT_BLOCKED'), (_0x156270['blockedKinds'] = _0xb70f5));
      else
        _0x2ab736['length'] &&
          ((_0x156270['type'] = 'ASSET_SUBMISSION_AMBIGUOUS'), (_0x156270['blockedKinds'] = _0x2ab736));
      ((_0x156270['cause'] = _0x3518c2),
        (_0x156270['assetExtractionDraft'] = cloneStoryAssetDetailedExtractionValue(_0x3b6427)));
      throw _0x156270;
    }
    const _0x100928 = new Set(),
      _0x52601d = new Set(),
      _0x1ecad0 = _0x1e2541['flatMap']((_0x331c52) =>
        (_0x3b6427['assetsByKind'][_0x331c52] || [])['map']((_0x15307b, _0x2cb671) => {
          const _0x437cf8 = makeUniqueStoryAssetExtractionRef(
            _0x15307b['ref'],
            _0x331c52 + '-' + (_0x2cb671 + 0x1),
            _0x100928,
            _0x32640b,
          );
          return {
            ..._0x15307b,
            ref: _0x437cf8,
            appearances: _0x15307b['appearances']['map']((_0x261c63, _0x3b563e) => ({
              ..._0x261c63,
              ref: makeUniqueStoryAssetExtractionRef(
                _0x261c63['ref'],
                _0x437cf8 + '-appearance-' + (_0x3b563e + 0x1),
                _0x52601d,
                _0x32640b,
              ),
            })),
          };
        }),
      );
    return (
      (_0x3b6427['status'] = 'completed'),
      await _0x20c4a4('资产提取完成：' + _0x1ecad0['length'] + '\x20个'),
      { schemaVersion: _0x2d9a62, extractionStrategy: 'kind-detailed-parallel', assets: _0x1ecad0 }
    );
  };
}
